// server/routes/photoRouter.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/authenticateToken");

// 1) 사진 업로드 (원래 코드, 건드리지 않음)
router.post("/uploadPhoto", authenticateToken, async (req, res) => {
  console.log("🚀 [백엔드 수신] /uploadPhoto 요청 도착");
  const user_id = req.user.user_id;
  const { file_name, lat, lng, taken_at } = req.body;

  if (!user_id || !file_name || !lat || !lng || !taken_at) {
    return res.status(400).json({ message: "필수 데이터 누락" });
  }

  const sql = `
    INSERT INTO photo_info (user_id, file_name, exif_loc, taken_at, tags, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?)
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
      lat,
      lng,
    ]);
    console.log("📥 사진 업로드 DB 저장됨:", {
      user_id,
      file_path: `/uploads/${file_name}`,
      location,
      taken_at: taken_at_mysql,
      lat,
      lng,
    });
    res.json({ message: "📸 사진 정보 DB 저장 완료" });
  } catch (error) {
    console.error("❌ DB 저장 실패:", error);
    res.status(500).json({ message: "DB 오류" });
  }
});

// 2) 로그인된 유저 사진 전체 조회 (photo_idx 포함, 반드시 lat/lng도 내려보냄)
router.get("/userPhotos", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: "인증 실패: 사용자 정보 없음" });
  }

  const user_id = req.user.user_id;

  try {
    // 각 사진의 진짜 위경도(lat/lng) 정보를 select
    const [rows] = await db.execute(
      `
      SELECT 
        p.photo_idx, p.file_name, p.taken_at,
        p.lat, p.lng,   -- 반드시 포함!
        d.diary_idx,
        d.diary_title, d.diary_content, d.trip_date
      FROM photo_info p
      LEFT JOIN ai_diary_photos ap ON p.photo_idx = ap.photo_idx
      LEFT JOIN ai_diary_info d ON ap.diary_idx = d.diary_idx
      WHERE p.user_id = ?
      `,
      [user_id]
    );

    // 응답 객체 생성 (lat/lng가 null이면 마커 생성 안 함)
    const photos = rows
      .filter(r => r.lat !== null && r.lng !== null)
      .map((r) => ({
        photoIdx: r.photo_idx,
        filePath: r.file_name.startsWith("/uploads/")
          ? r.file_name
          : `/uploads/${r.file_name}`,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
        taken_at: r.taken_at,
        diary: r.diary_title
          ? {
              diary_idx: r.diary_idx,
              diary_title: r.diary_title,
              diary_content: r.diary_content,
              trip_date: r.trip_date,
            }
          : null,
      }));

    res.json(photos);
  } catch (err) {
    console.error("❌ /userPhotos 에러:", err);
    res.status(500).json({ message: "사진 조회 실패" });
  }
});

module.exports = router;
