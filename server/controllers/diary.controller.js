require("dotenv").config();
const axios = require("axios");
const pool = require("../db");
const { extractExifData } = require("../utils/exifUtil");

const OPENAI_API_KEY = process.env.GPT_API_KEY;

// ✅ 1) 사진 + 메타데이터 기반 GPT 일기 생성
const generateDiaryFromImage = async (req, res) => {
  const user_id = req.user?.user_id || req.body.user_id;
  const { companion, feeling, length, tone, weather } = req.body;
  const imageFiles = req.files;

  if (!imageFiles || imageFiles.length === 0) {
    return res.status(400).json({ error: "이미지가 없습니다." });
  }

  try {
    const { dateList, gpsList, locationList, imageMessages } = await extractExifData(imageFiles);

    // 날짜 처리
    let tripDateStr, tripDateDB;
    if (dateList.length > 0) {
      dateList.sort((a, b) => a - b);
      const start = dateList[0].toISOString().slice(0, 10);
      const end = dateList[dateList.length - 1].toISOString().slice(0, 10);
      tripDateStr = start === end ? start : `${start} ~ ${end}`;
      tripDateDB = start;
    } else {
      tripDateStr = new Date().toISOString().slice(0, 10);
      tripDateDB = tripDateStr;
    }

    // 🔧 일기 본문에 위도/경도 정보 포함 안 되도록 locationInfo 제외
    const promptText = `
너는 여행 감성 일기 작가야. 아래 조건과 사진들을 참고해서 여행 일기를 작성해줘. 다음 사항을 반드시 지켜줘:

1. 제목에는 '## 제목:' 같은 형식 없이 자연스럽고 감성적인 제목을 넣어줘.
2. 제목과 본문을 분명히 구분해서 써줘. 제목을 한 줄로 먼저 작성하고 그 다음에 본문을 써줘.
3. 본문에도 '본문:' 같은 표현 없이, 자연스럽게 이어서 작성해줘.
4. 사진에 나온 장면, 분위기, 인물, 배경 등을 분석해서 반드시 본문에 반영해줘.
5. 사진에 나온 배경이 어디인지 유추할 수 있으면 지역이나 명소 이름을 넣어줘.
6. 사용자가 입력한 정보도 일기 내용에 자연스럽게 포함해줘.

말투 스타일은 다음 중 하나야:
- 감성적인 말투: 부드럽고 비유적인 표현을 써줘. 문장에 감정이 담기도록 해줘.
- 담백한 말투: 군더더기 없이, 사실 중심으로 정직하게 써줘.
- 발랄한 말투: 반말을 사용하고, 귀엽고 톡톡 튀는 여자아이 말투로 써줘. 너무 과하지 않게!
- 유머러스한 말투: 반말을 사용하고, 요즘 밈이나 말장난, 웃긴 표현이 자연스럽게 들어가게 해줘.

- 날짜: ${tripDateStr}
- 동반자: ${companion}
- 기분: ${feeling}
- 날씨: ${weather}
- 글 길이: ${length}
- 말투 스타일: ${tone}
    `.trim();

    const messages = [
      {
        role: "system",
        content: "너는 여행 감성 일기를 쓰는 작가야. 일기 제목과 본문을 작성해줘.",
      },
      {
        role: "user",
        content: promptText,
        images: imageMessages,
      },
    ];

    const gptRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const fullText = gptRes.data.choices[0].message.content.trim();
    const [titleLine, ...bodyLines] = fullText.split("\n");
    const diaryTitle = titleLine.replace(/^##\s*제목:?\s*/, "").trim();
    const diaryContent = bodyLines.join("\n").trim();

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const [dRes] = await conn.query(
      `INSERT INTO ai_diary_info (user_id, diary_title, diary_content, trip_date)
       VALUES (?, ?, ?, ?)`,
      [user_id, diaryTitle, diaryContent, tripDateDB]
    );
    const diary_idx = dRes.insertId;

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const { lat, lng } = gpsList[i];

      const [pRes] = await conn.query(
        `INSERT INTO photo_info 
           (user_id, file_name, exif_loc, taken_at, tags, lat, lng)
         VALUES (?, ?, ?, NOW(), '', ?, ?)`,
        [user_id, file.filename, "", lat, lng]
      );

      const photo_idx = pRes.insertId;

      await conn.query(
        `INSERT INTO ai_diary_photos (diary_idx, photo_idx, created_at)
         VALUES (?, ?, NOW())`,
        [diary_idx, photo_idx]
      );
    }

    await conn.commit();
    conn.release();

    try {
      await axios.post("http://localhost:6006/classify");
      console.log("✔️ Flask 서버로 분류 요청 전송 완료");
    } catch (err) {
      console.warn("❌ Flask 호출 실패:", err.message);
    }

    return res.json({
      message: "일기 저장 완료",
      diary_idx,
      trip_date: tripDateStr,
    });
  } catch (error) {
    console.error("일기 생성 실패:", error.response?.data || error.message);
    return res.status(500).json({ error: "일기 생성 실패" });
  }
};

// 기존 기능 유지
const getDiaryById = async (req, res) => {
  const diaryId = req.params.id;
  try {
    const [diaries] = await pool.query(
      "SELECT * FROM ai_diary_info WHERE diary_idx = ?",
      [diaryId]
    );
    if (diaries.length === 0) {
      return res.status(404).json({ error: "일기를 찾을 수 없습니다." });
    }
    const diary = diaries[0];

    const [photos] = await pool.query(
      `SELECT p.photo_idx, p.file_name, p.lat, p.lng, p.taken_at
         FROM ai_diary_photos ap 
         JOIN photo_info p ON ap.photo_idx = p.photo_idx
        WHERE ap.diary_idx = ?`,
      [diaryId]
    );

    return res.json({ diary, photos });
  } catch (err) {
    console.error("일기 조회 실패:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
};

const getDiaryByPhotoIdx = async (req, res) => {
  const user_id = req.user.user_id;
  const photoIdx = req.params.photoIdx;
  try {
    const [rows] = await pool.query(
      `SELECT d.diary_idx, d.diary_title, d.diary_content, d.trip_date
         FROM ai_diary_photos ap
         JOIN ai_diary_info d ON ap.diary_idx = d.diary_idx
        WHERE ap.photo_idx = ? AND d.user_id = ?`,
      [photoIdx, user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "해당 사진의 일기가 없습니다." });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("사진별 일기 조회 실패:", err);
    return res.status(500).json({ message: "일기 조회 실패" });
  }
};

const getAllDiariesByUser = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await pool.query(
      `SELECT d.diary_idx,
              d.diary_title,
              d.diary_content,
              d.trip_date,
              (
                SELECT p.file_name
                  FROM ai_diary_photos dp
                  JOIN photo_info p ON dp.photo_idx = p.photo_idx
                 WHERE dp.diary_idx = d.diary_idx
                 ORDER BY dp.created_at ASC
                 LIMIT 1
              ) AS file_name
         FROM ai_diary_info d
        WHERE d.user_id = ?
        ORDER BY d.trip_date DESC
        LIMIT 5`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "등록된 일기가 없습니다." });
    }

    return res.json(rows);
  } catch (err) {
    console.error("사용자 일기 목록 조회 실패:", err);
    return res.status(500).json({ message: "일기 목록 조회 실패" });
  }
};

const getRandomDiariesByUser = async (req, res) => {
  const user_id = req.user?.user_id;

  if (!user_id) {
    console.warn("❌ user_id가 없음. 인증 실패 처리.");
    return res.status(401).json({ message: "사용자 인증 실패" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT d.diary_idx,
          d.diary_title,
          d.diary_content,
          d.trip_date,
          (
            SELECT p.file_name
            FROM ai_diary_photos dp
            LEFT JOIN photo_info p ON dp.photo_idx = p.photo_idx
            WHERE dp.diary_idx = d.diary_idx
            ORDER BY dp.created_at ASC
            LIMIT 1
          ) AS file_name
   FROM ai_diary_info d
   WHERE d.user_id = ?
   ORDER BY RAND()
   LIMIT 3`,
      [user_id]
    );

    if (rows.length === 0) {
      console.warn("⚠️ 랜덤 일기 결과 없음. 빈 배열 반환");
      return res.status(200).json([]);
    }

    return res.json(rows);
  } catch (err) {
    console.error("❌ 쿼리 실패:", err);
    return res.status(500).json({ message: "랜덤 일기 조회 실패" });
  }
};

// ✅ 5. 일기 삭제
const deleteDiary = async (req, res) => {
  const diaryId = req.params.id;
  const user_id = req.user?.user_id || req.body.user_id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. 관련된 photo_idx 가져오기
    const [photoRows] = await conn.query(
      `SELECT p.photo_idx
       FROM ai_diary_photos ap
       JOIN photo_info p ON ap.photo_idx = p.photo_idx
       WHERE ap.diary_idx = ? AND p.user_id = ?`,
      [diaryId, user_id]
    );
    const photoIdxList = photoRows.map(row => row.photo_idx);

    // 2. ai_diary_photos에서 삭제
    await conn.query(
      `DELETE FROM ai_diary_photos WHERE diary_idx = ?`,
      [diaryId]
    );

    // 3. photo_info에서 삭제
    if (photoIdxList.length > 0) {
      await conn.query(
        `DELETE FROM photo_info WHERE photo_idx IN (?) AND user_id = ?`,
        [photoIdxList, user_id]
      );
    }

    // 4. ai_diary_info에서 삭제
    await conn.query(
      `DELETE FROM ai_diary_info WHERE diary_idx = ? AND user_id = ?`,
      [diaryId, user_id]
    );

    await conn.commit();
    res.json({ message: "일기 삭제 성공" });
  } catch (err) {
    await conn.rollback();
    console.error("일기 삭제 실패:", err);
    res.status(500).json({ error: "일기 삭제 실패" });
  } finally {
    conn.release();
  }
};



module.exports = {
  generateDiaryFromImage,
  getDiaryById,
  getDiaryByPhotoIdx,
  getAllDiariesByUser,
  getRandomDiariesByUser,
  deleteDiary,
};
