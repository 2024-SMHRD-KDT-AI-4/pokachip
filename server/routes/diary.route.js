// server/routes/diary.route.js
const express = require("express");
const path    = require("path");
const multer  = require("multer");
const router  = express.Router();

const diaryController   = require("../controllers/diary.controller");
const authenticateToken = require("../middleware/authenticateToken");

// Multer 셋업 (최대 5장)
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 1) GPT 일기 생성
router.post(
  "/image-generate",
  authenticateToken,
  upload.array("photos", 5),
  diaryController.generateDiaryFromImage
);

router.get("/randomlist", authenticateToken, diaryController.getRandomDiariesByUser);


// 2) 일기 ID로 조회
router.get("/:id", authenticateToken, diaryController.getDiaryById);

// 3) 사진 클릭 시 해당 일기 조회
router.get("/photo/:photoIdx", authenticateToken, diaryController.getDiaryByPhotoIdx);



// 4) 로그인한 사용자의 전체 일기 목록 조회
// GET /api/diary/
router.get("/", authenticateToken, diaryController.getAllDiariesByUser);

// ✅ 5) 일기 삭제
router.delete("/:id", authenticateToken, diaryController.deleteDiary);


module.exports = router;
