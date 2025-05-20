const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { generateDiaryFromImage } = require('../controllers/diary.controller');

// 이미지 저장 폴더 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// POST /api/diary/image-generate
router.post('/image-generate', upload.array('photos', 5), generateDiaryFromImage);

module.exports = router;
