// ✅ controllers/diary.controller.js - 다중 메타데이터 처리 및 날짜 범위 대응 포함

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ExifParser = require('exif-parser');
const pool = require('../config/db');
const OPENAI_API_KEY = 'your-api-key-here';

exports.generateDiaryFromImage = async (req, res) => {
  const { companion, feeling, length, tone, weather, user_id } = req.body;
  const imageFiles = req.files;

  if (!imageFiles || imageFiles.length === 0) {
    return res.status(400).json({ error: '이미지가 없습니다.' });
  }

  try {
    let dateList = [];
    let locationList = [];

    // 각 사진에 대해 EXIF 메타데이터(날짜, 위치데이터)를 추출하는 반복문 구조 
    const imageMessages = imageFiles.map((file) => {
      const imagePath = path.join(__dirname, '../uploads', file.filename);
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      try {
        const parser = ExifParser.create(imageBuffer);
        const result = parser.parse();

        // 각 이미지의 촬영날짜 가져오기. 
        if (result.tags.DateTimeOriginal) {
          const date = new Date(result.tags.DateTimeOriginal * 1000);
          dateList.push(date);
        }

        // 각 이미지의 GPS 위치 수집하여 locationList에 누적 -> GPT 프롬프트에 참고용으로 사용
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

    // ✅ 날짜 범위 문자열 생성
    let tripDateStr = '';
    let tripDateDB = null;
    if (dateList.length > 0) {
      // 사진 촬영날짜 정렬. 여행 시작일과 종료일 계산
      const sortedDates = dateList.sort((a, b) => a - b);
      const start = sortedDates[0].toISOString().slice(0, 10);
      const end = sortedDates[sortedDates.length - 1].toISOString().slice(0, 10);
      tripDateStr = start === end ? start : `${start} ~ ${end}`;
      tripDateDB = start; // DB에는 시작 날짜만 저장
    } else {
      tripDateStr = new Date().toISOString().slice(0, 10);
      tripDateDB = tripDateStr;
    }

    const locationInfo = locationList.length > 0 ? locationList.join(', ') : '';

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

    const fullText = response.data.choices[0].message.content.trim();
    const [titleLine, ...bodyLines] = fullText.split('\n');
    const diaryTitle = titleLine.replace(/^## 제목: /, '').trim();
    const diaryContent = bodyLines.join('\n').trim();

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const [diaryResult] = await conn.query(
      `INSERT INTO ai_diary_info (user_id, diary_title, diary_content, trip_date)
       VALUES (?, ?, ?, ?)`,
      [user_id, diaryTitle, diaryContent, tripDateDB]
    );
    const diary_idx = diaryResult.insertId;

    for (const file of imageFiles) {
      const [photoResult] = await conn.query(
        `INSERT INTO photo_info (user_id, file_name, exif_loc, taken_at, tags)
         VALUES (?, ?, ?, NOW(), '')`,
        [user_id, file.filename, locationInfo]
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

    res.json({ message: '일기 저장 완료', diary: diaryContent, title: diaryTitle, diary_idx, trip_date: tripDateStr });
  } catch (error) {
    console.error('GPT 또는 DB 저장 실패:', error.response?.data || error.message);
    res.status(500).json({ error: 'GPT 또는 저장 실패' });
  }
};
