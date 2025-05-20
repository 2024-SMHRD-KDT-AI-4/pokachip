const express = require('express');
const cors = require('cors');
const diaryRouter = require('./routes/diary.route'); // 경로 맞춰줘야 함

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ✅ 이 부분 꼭 있어야 함!
app.use('/api/diary', diaryRouter);

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});
