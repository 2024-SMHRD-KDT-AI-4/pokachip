const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth.route'); // ✅ 추가
const path = require("path");
const app = express();
const PORT = 5000;

// ✅ [1] 공통 미들웨어 설정
app.use(cors());
app.use(express.json());

// ✅ [2] API 라우트 테스트
app.get('/api/test', (req, res) => {
  res.json({ message: 'API 테스트 성공! 🎯' });
});

// ✅ [3] photoRouter.js 라우터 먼저 등록
const photoRouter = require("./routes/photoRouter");
app.use("/", photoRouter); // 반드시 정적파일 서빙 전에 있어야 함

// ✅ [4] 정적 파일 서빙 (React build 결과)
app.use(express.static(path.join(__dirname, "../client/dist")));

// ✅ [5] 나머지 모든 경로는 React index.html로 처리
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
});

app.use('/api', authRouter); // 🔑 로그인은 /api/login 으로 요청함

// ✅ [6] 요청 로깅
app.use((req, res, next) => {
  console.log("🛬 요청 받음:", req.method, req.url);
  next();
});

// ✅ [7] 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
