// ✅ GPT 기반 감성 일기 생성 + DB 저장 + 일기 조회 컨트롤러

require("dotenv").config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ExifParser = require('exif-parser');
const pool = require('../db');
// const OPENAI_API_KEY = process.env.GPT_API_KEY;

// ✅ 1. 사진과 메타데이터 기반으로 GPT 감성 일기 생성 + DB 저장
exports.generateDiaryFromImage = async (req, res) => {
  const { companion, feeling, length, tone, weather, user_id } = req.body;
  const imageFiles = req.files;

  if (!imageFiles || imageFiles.length === 0) {
    return res.status(400).json({ error: '이미지가 없습니다.' });
  }

  try {
    let dateList = [];
    let locationList = [];

    // ✅ EXIF 메타데이터 추출 (날짜, 위치 등)
    const imageMessages = imageFiles.map((file) => {
      const imagePath = path.join(__dirname, '../uploads', file.filename);
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      try {
        const parser = ExifParser.create(imageBuffer);
        const result = parser.parse();

        // 촬영 날짜 추출
        if (result.tags.DateTimeOriginal) {
          const date = new Date(result.tags.DateTimeOriginal * 1000);
          dateList.push(date);
        }

        // GPS 위치 추출
        if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
          const lat = result.tags.GPSLatitude;
          const lon = result.tags.GPSLongitude;
          locationList.push(`위도 ${lat}, 경도 ${lon}`);
        }
      } catch (err) {
        console.warn('EXIF 추출 실패:', err.message);
      }

      return {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      };
    });

    // ✅ 여행 날짜 범위 설정
    let tripDateStr = '';
    let tripDateDB = null;
    if (dateList.length > 0) {
      const sortedDates = dateList.sort((a, b) => a - b);
      const start = sortedDates[0].toISOString().slice(0, 10);
      const end = sortedDates[sortedDates.length - 1].toISOString().slice(0, 10);
      tripDateStr = start === end ? start : `${start} ~ ${end}`;
      tripDateDB = start;
    } else {
      tripDateStr = new Date().toISOString().slice(0, 10);
      tripDateDB = tripDateStr;
    }

    const locationInfo = locationList.length > 0 ? locationList.join(', ') : '';

    // ✅ GPT에 전달할 프롬프트 작성
    const promptText = `
너는 여행 감성 일기 작가야. 다음 조건과 사진을 참고해서 아래와 같이 작성해줘:

1. ## 제목: 으로 시작하는 일기 제목 생성
2. 감성적인 여행 일기 본문 작성

조건:
- 동반자: ${companion}
- 기분: ${feeling}
- 날씨: ${weather}
- 말투 스타일: ${tone}
- 글 길이: ${length}
- 여행 날짜: ${tripDateStr}
${locationInfo ? `- 촬영 위치: ${locationInfo}` : ''}

요청:
- 사진에 나온 장면, 활동, 분위기, 장소 느낌 등을 반영해서 써줘.
- 설명문 같지 않게 감성적으로 써줘.
`;

    const messages = [
      {
        role: 'system',
        content: '너는 여행 감성 일기를 쓰는 작가야. 일기 제목과 본문을 작성해줘.'
      },
      {
        role: 'user',
        content: [...imageMessages, { type: 'text', text: promptText }]
      }
    ];

    // ✅ GPT API 호출
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages,
        max_tokens: 1500,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // ✅ GPT 응답 파싱 (제목 + 본문)
    const fullText = response.data.choices[0].message.content.trim();
    const [titleLine, ...bodyLines] = fullText.split('\n');
    const diaryTitle = titleLine.replace(/^## 제목: /, '').trim();
    const diaryContent = bodyLines.join('\n').trim();

    // ✅ DB에 저장 (일기 + 사진)
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const [diaryResult] = await conn.query(
      `INSERT INTO ai_diary_info (user_id, diary_title, diary_content, trip_date)
       VALUES (?, ?, ?, ?)`,
      [user_id, diaryTitle, diaryContent, tripDateDB]
    );
    const diary_idx = diaryResult.insertId;

    // ✅ 사진 업로드 및 DB 저장 (file_name에 이미지 경로까지 포함해 저장)
// ✅ 사진 업로드 및 DB 저장 (file_name = 실제 파일명만 저장)
for (const file of imageFiles) {
  const imageUrl = file.filename; // ← uploads/ 없이 파일명만 저장

  const [photoResult] = await conn.query(
    `INSERT INTO photo_info (user_id, file_name, exif_loc, taken_at, tags)
     VALUES (?, ?, ?, NOW(), '')`,
    [user_id, imageUrl, locationInfo]
  );

  const photo_idx = photoResult.insertId;

  await conn.query(
    `INSERT INTO ai_diary_photos (diary_idx, photo_idx, created_at)
     VALUES (?, ?, NOW())`,
    [diary_idx, photo_idx]
  );
}


    await conn.commit();
    conn.release();

    // ✅ 프론트에 응답
    res.json({
      message: '일기 저장 완료',
      diary: diaryContent,
      title: diaryTitle,
      diary_idx,
      trip_date: tripDateStr
    });
  } catch (error) {
    console.error('GPT 또는 DB 저장 실패:', error.response?.data || error.message);
    res.status(500).json({ error: 'GPT 또는 저장 실패' });
  }
};



// ✅ 2. 일기 ID로 조회하여 프론트에 전달
exports.getDiaryById = async (req, res) => {
  const diaryId = req.params.id;

  try {
    // 일기 본문 정보 조회
    const [diaryRows] = await pool.query(
      'SELECT * FROM ai_diary_info WHERE diary_idx = ?',
      [diaryId]
    );

    if (diaryRows.length === 0) {
      return res.status(404).json({ error: '일기를 찾을 수 없습니다.' });
    }

    // 사진 정보 조회 (ai_diary_photos 테이블 기준으로 조인)
    const [photoRows] = await pool.query(
      `SELECT p.file_name
       FROM ai_diary_photos ap
       JOIN photo_info p ON ap.photo_idx = p.photo_idx
       WHERE ap.diary_idx = ?`,
      [diaryId]
    );

    // 프론트로 응답
    res.json({
      diary: diaryRows[0],
      photos: photoRows
    });
  } catch (err) {
    console.error('📛 일기 조회 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
};
