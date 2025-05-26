require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ExifParser = require("exif-parser");
const pool = require("../db");
const OPENAI_API_KEY = process.env.GPT_API_KEY;

// 1) 사진 + 메타데이터 기반 GPT 일기 생성
exports.generateDiaryFromImage = async (req, res) => {
  const user_id = req.user.user_id;
  const { companion, feeling, length, tone, weather } = req.body;
  const imageFiles = req.files;

  if (!imageFiles || imageFiles.length === 0) {
    return res.status(400).json({ error: "이미지가 없습니다." });
  }

  try {
    let dateList = [];
    let locationList = [];
    const gpsList = [];

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
          const lat = result.tags.GPSLatitude;
          const lng = result.tags.GPSLongitude;
          locationList.push(`위도 ${lat}, 경도 ${lng}`);
          gpsList.push({ lat, lng });
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

    const locationInfo =
      locationList.length > 0 ? locationList.join(", ") : "";

    const promptText = `
너는 여행 감성 일기 작가야. 다음 조건과 사진을 참고해서 작성해줘:

- 동반자: ${companion}
- 기분: ${feeling}
- 날씨: ${weather}
- 말투 스타일: ${tone}
- 글 길이: ${length}
- 여행 날짜: ${tripDateStr}
${locationInfo ? `- 촬영 위치: ${locationInfo}` : ""}

## 제목:
(여기에 일기 제목)

## 본문:
(감성적으로 여행 일기 작성)
`;

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
      `INSERT INTO ai_diary_info 
         (user_id, diary_title, diary_content, trip_date)
       VALUES (?, ?, ?, ?)`,
      [user_id, diaryTitle, diaryContent, tripDateDB]
    );
    const diary_idx = dRes.insertId;

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileName = file.filename;
      const { lat, lng } = gpsList[i];

      const [pRes] = await conn.query(
        `INSERT INTO photo_info 
           (user_id, file_name, exif_loc, taken_at, tags, lat, lng)
         VALUES (?, ?, ?, NOW(), '', ?, ?)`,
        [user_id, fileName, locationInfo, lat, lng]
      );

      const photo_idx = pRes.insertId;
      await conn.query(
        `INSERT INTO ai_diary_photos 
           (diary_idx, photo_idx, created_at)
         VALUES (?, ?, NOW())`,
        [diary_idx, photo_idx]
      );
    }

    await conn.commit();
    conn.release();

    try {
      await axios.post('http://localhost:6006/classify');
      console.log('✔️ Flask 서버로 분류 요청 전송 완료');
    } catch (err) {
      console.error('❌ Flask 서버 호출 실패:', err.message);
    }

    return res.json({
      message: "일기 저장 완료",
      diary_idx,
      trip_date: tripDateStr,
    });

  } catch (error) {
    console.error('GPT 또는 DB 저장 실패:', error.response?.data || error.message);
    res.status(500).json({ error: 'GPT 또는 저장 실패' });
  }
};

// 2) 일기 ID로 일기 + 사진 + 좌표 조회 (📍 지도용)
exports.getDiaryById = async (req, res) => {
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
      `SELECT p.photo_idx, p.file_name, p.lat, p.lng
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

// 3) 사진 클릭 시 해당 일기 조회
exports.getDiaryByPhotoIdx = async (req, res) => {
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
