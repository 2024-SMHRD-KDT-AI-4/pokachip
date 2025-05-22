// routes/photoRouter.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/authenticateToken");

// … 기존 uploadPhoto POST 라우트는 그대로 두세요

// ▶ 로그인된 유저 사진만 조회하는 GET /userPhotos
router.get("/userPhotos", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;               // 토큰에서 꺼낸 이메일
  console.log("🔑 조회할 user_id:", user_id);

  try {
    const [rows] = await db.execute(
      `SELECT file_name, exif_loc, taken_at
         FROM photo_info
        WHERE user_id = ?`,
      [user_id]
    );

    // exif_loc: "위도:36.xxxx, 경도:127.xxxx" → 숫자 추출
    const photos = rows.map((r) => {
      const [lat, lng] = r.exif_loc
        .replace("위도:", "")
        .replace("경도:", "")
        .split(",")
        .map((s) => parseFloat(s.trim()));
      return {
        filePath: r.file_name.startsWith("/uploads/")
          ? r.file_name
          : `/uploads/${r.file_name}`,   // 경로 보장
        lat,
        lng,
        taken_at: r.taken_at,
      };
    });

    console.log("✅ 사진 개수:", photos.length);
    res.json(photos);
  } catch (err) {
    console.error("❌ /userPhotos 에러:", err);
    res.status(500).json({ message: "사진 조회 실패" });
  }
});

module.exports = router;
