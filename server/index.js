const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 테스트용 라우트
app.get('/', (req, res) => {
  res.send('서버 연결 성공! 🎉');
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});