require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ExifParser = require("exif-parser");
const pool = require("../db");
const OPENAI_API_KEY = process.env.GPT_API_KEY;

// ✅ 1) 사진 + 메타데이터 기반 GPT 일기 생성 (사용자 기능 포함)
const generateDiaryFromImage = async (req, res) => {
  const user_id = req.user?.user_id || req.body.user_id;
  const { companion, feeling, length, tone, weather } = req.body;
  const imageFiles = req.files;

  if (!imageFiles || imageFiles.length === 0) {
    return res.status(400).json({ error: "이미지가 없습니다." });
  }

  try {
    const dateList = [];
    const locationList = []; // GPT용 텍스트
    const gpsList = [];      // DB용 위도/경도 좌표

    const imageMessages = imageFiles.map((file) => {
      const imagePath = path.join(__dirname, "../uploads", file.filename);
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString("base64");

      try {
        const parser = ExifParser.create(imageBuffer);
        const result = parser.parse();

        if (result.tags.DateTimeOriginal) {
          dateList.push(new Date(result.tags.DateTimeOriginal * 1000));
        }

        if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
          const lat = parseFloat(result.tags.GPSLatitude);
          const lng = parseFloat(result.tags.GPSLongitude);
          gpsList.push({ lat, lng });
          locationList.push(`위도 ${lat}, 경도 ${lng}`);
        } else {
          gpsList.push({ lat: null, lng: null });
        }
      } catch (err) {
        console.warn("EXIF 추출 실패:", err.message);
        gpsList.push({ lat: null, lng: null });
      }

      return {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
        },
      };
    });

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

    const locationInfo = locationList.length > 0 ? locationList.join(", ") : "";

    // ✅ GPT 프롬프트 (2번째 스타일)
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

- 촬영 위치: ${locationInfo || "정보 없음"}
- 날짜: ${tripDateStr}
- 동반자: ${companion}
- 기분: ${feeling}
- 날씨: ${weather}
- 글 길이: ${length}
- 말투 스타일: ${tone}
    `.trim();

    // ✅ GPT API 호출 (정상 방식)
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

    // ✅ 일기 저장
    const [dRes] = await conn.query(
      `INSERT INTO ai_diary_info (user_id, diary_title, diary_content, trip_date)
       VALUES (?, ?, ?, ?)`,
      [user_id, diaryTitle, diaryContent, tripDateDB]
    );
    const diary_idx = dRes.insertId;

    // ✅ 사진 저장
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const { lat, lng } = gpsList[i];

      const [pRes] = await conn.query(
        `INSERT INTO photo_info 
           (user_id, file_name, exif_loc, taken_at, tags, lat, lng)
         VALUES (?, ?, ?, NOW(), '', ?, ?)`,
        [user_id, file.filename, locationInfo, lat, lng]
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

    // ✅ Flask 서버에 태그 분류 요청
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


// 기존 팀원 기능 (유지)
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
      `SELECT d.diary_idx, d.diary_title, d.trip_date,
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

// ✅ export
module.exports = {
  generateDiaryFromImage,
  getDiaryById,
  getDiaryByPhotoIdx,
  getAllDiariesByUser,
};
