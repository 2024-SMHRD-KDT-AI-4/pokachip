// server/routes/diary.route.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/authenticateToken");

// (기존 diary 관련 라우트들…)

// ▶ 사진(photoIdx) 클릭 시 해당 일기 가져오기
// GET /api/diary/photo/:photoIdx
router.get(
  "/photo/:photoIdx",
  authenticateToken,
  async (req, res) => {
    const user_id = req.user.user_id;
    const photoIdx = req.params.photoIdx;

    try {
      const [rows] = await db.execute(
        `SELECT d.diary_idx,
                d.diary_title,
                d.diary_content,
                d.trip_date
           FROM ai_diary_photos ap
           JOIN ai_diary_info  d ON ap.diary_idx = d.diary_idx
          WHERE ap.photo_idx = ?
            AND d.user_id    = ?`,
        [photoIdx, user_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "해당 사진의 일기가 없습니다." });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error("❌ /api/diary/photo 에러:", err);
      res.status(500).json({ message: "일기 조회 실패" });
    }
  }
);

module.exports = router;
