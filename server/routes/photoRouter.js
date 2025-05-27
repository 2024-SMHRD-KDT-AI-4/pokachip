// server/routes/photoRouter.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/authenticateToken");

// 1) 사진 업로드 (원래 코드)
router.post("/uploadPhoto", authenticateToken, async (req, res) => {
  console.log("🚀 [백엔드 수신] /uploadPhoto 요청 도착");
  const user_id = req.user.user_id;
  const { file_name, lat, lng, taken_at } = req.body;

  if (!user_id || !file_name || !lat || !lng || !taken_at) {
    return res.status(400).json({ message: "필수 데이터 누락" });
  }

  const sql = `
    INSERT INTO photo_info (user_id, file_name, exif_loc, taken_at, tags)
    VALUES (?, ?, ?, ?, ?)
  `;
  const location = `위도:${lat}, 경도:${lng}`;

  const date = new Date(taken_at);
  date.setHours(date.getHours() + 9);
  const taken_at_mysql = date.toISOString().slice(0, 19).replace("T", " ");

  try {
    await db.execute(sql, [
      user_id,
      `/uploads/${file_name}`,
      location,
      taken_at_mysql,
      "",
    ]);
    console.log("📥 사진 업로드 DB 저장됨:", {
      user_id,
      file_path: `/uploads/${file_name}`,
      location,
      taken_at: taken_at_mysql,
    });
    res.json({ message: "📸 사진 정보 DB 저장 완료" });
  } catch (error) {
    console.error("❌ DB 저장 실패:", error);
    res.status(500).json({ message: "DB 오류" });
  }
});

// 2) 로그인된 유저 사진만 조회 (photo_idx 포함)
router.get("/userPhotos", authenticateToken, async (req, res) => {
  console.log("🔥 디버깅 req.user:", req.user);

  if (!req.user || !req.user.user_id) {
    console.warn("❌ 인증 실패: 사용자 정보 없음");
    return res.status(401).json({ message: "인증 실패: 사용자 정보 없음" });
  }

  const user_id = req.user.user_id;
  console.log("🔑 조회할 user_id:", user_id);

  try {
    const [rows] = await db.execute(
      `
      SELECT 
        p.photo_idx, p.file_name, p.exif_loc, p.taken_at,
        d.diary_idx,               -- ✅ diary_idx 가져오기
        d.diary_title, d.diary_content, d.trip_date
      FROM photo_info p
      LEFT JOIN ai_diary_photos ap ON p.photo_idx = ap.photo_idx
      LEFT JOIN ai_diary_info d ON ap.diary_idx = d.diary_idx
      WHERE p.user_id = ?
      `,
      [user_id]
    );

    const photos = rows
      .map((r) => {
        const nums = r.exif_loc?.match(/-?\d+(\.\d+)?/g);
        if (!nums || nums.length < 2) return null;

        return {
          photoIdx: r.photo_idx,
          filePath: r.file_name.startsWith("/uploads/")
            ? r.file_name
            : `/uploads/${r.file_name}`,
          lat: parseFloat(nums[0]),
          lng: parseFloat(nums[1]),
          taken_at: r.taken_at,
          diary: r.diary_title
            ? {
                diary_idx: r.diary_idx,  // ✅ 이 줄 추가
                diary_title: r.diary_title,
                diary_content: r.diary_content,
                trip_date: r.trip_date,
              }
            : null,
        };
      })
      .filter((p) => p !== null);

    console.log("✅ 조회된 사진 개수:", photos.length);
    res.json(photos);
  } catch (err) {
    console.error("❌ /userPhotos 에러:", err);
    res.status(500).json({ message: "사진 조회 실패" });
  }
});

module.exports = router;
