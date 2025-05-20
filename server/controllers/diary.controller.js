// ✅ controllers/diary.controller.js - 다중 이미지 기반 GPT-4o 감성 일기 생성

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const OPENAI_API_KEY = ''
exports.generateDiaryFromImage = async (req, res) => {
  const { companion, feeling, length, tone, weather } = req.body;
  const imageFiles = req.files;

  if (!imageFiles || imageFiles.length === 0) {
    return res.status(400).json({ error: '이미지가 없습니다.' });
  }

  try {
    // 여러 이미지를 base64로 변환하여 GPT에 전달할 메시지 구성
    const imageMessages = imageFiles.map((file) => {
      const imagePath = path.join(__dirname, '../uploads', file.filename);
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      return {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      };
    });

    // 텍스트 조건 메시지 추가
    const promptText = `
다음은 여행 중 촬영된 사진들입니다.
사진들의 내용을 종합하여 감성적이고 자연스러운 여행 일기를 작성해줘.

조건:
- 동반자: ${companion}
- 기분: ${feeling}
- 날씨: ${weather}
- 말투 스타일: ${tone}
- 글의 길이: ${length}

요청:
- 사진에 나온 장면, 활동, 분위기 등을 반영해서 글을 써줘.
- 자연스럽고 감성적인 톤으로 작성해줘.
- 설명문 같지 않게, 진짜 하루를 기록한 것처럼 써줘.
`;

    const messages = [
      {
        role: 'system',
        content: '너는 여행 감성 일기를 작성하는 작가야. 이미지와 사용자 정보를 참고해 글을 작성해줘.'
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

    const diary = response.data.choices[0].message.content;
    res.json({ diary });
  } catch (error) {
    console.error('GPT-4o 호출 실패:', error.response?.data || error.message);
    res.status(500).json({ error: 'GPT 호출 실패' });
  }
};
