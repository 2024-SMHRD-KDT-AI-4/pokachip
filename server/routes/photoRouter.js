const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/uploadPhoto", async (req, res) => {
  console.log("🚀 [백엔드 수신] /uploadPhoto 요청 도착");

  const { user_id, file_name, lat, lng, taken_at } = req.body;

  console.log("📦 요청 본문 데이터:", {
    user_id,
    file_name,
    lat,
    lng,
    taken_at,
  });

  // ❗ 방어 코드 추가
  if (!user_id || !file_name || !lat || !lng || !taken_at) {
    return res.status(400).json({ message: "필수 데이터 누락" });
  }

  const sql = `
    INSERT INTO photo_info (user_id, file_name, exif_loc, taken_at, tags)
    VALUES (?, ?, ?, ?, ?)
  `;

  const location = `위도:${lat}, 경도:${lng}`;

  // ✅ 한국 시간 기준 보정
  const date = new Date(taken_at);
  date.setHours(date.getHours() + 9);
  const taken_at_mysql = date.toISOString().slice(0, 19).replace("T", " ");

  try {
    await db.execute(sql, [
      user_id,
      `/uploads/${file_name}`,
      location,
      taken_at_mysql,
      ""
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

module.exports = router;
