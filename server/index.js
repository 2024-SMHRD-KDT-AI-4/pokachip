const express = require('express');
const cors = require('cors');
const path = require("path"); // ✅ 경로 모듈

const app = express();
const PORT = 5000;

// ✅ [1] 공통 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 요청 파싱

// ✅ [2] API 라우트 테스트 (개발용)
app.get('/api/test', (req, res) => {
  res.json({ message: 'API 테스트 성공! 🎯' });
});

// ✅ [3] 정적 파일 서빙 (React build 결과)
app.use(express.static(path.join(__dirname, "../client/dist")));

// ✅ [4] 나머지 모든 경로는 React index.html로 처리
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
});

// ✅ [5] 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
