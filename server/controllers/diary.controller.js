// server/controllers/diary.controller.js
require("dotenv").config();
const axios = require("axios");
const pool = require("../db");
const { extractExifData } = require("../utils/exifUtil");
const { buildPrompt } = require("../utils/promptBuilder");
const { callGPT } = require("../services/gptService");


const FLASK_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FLASK_DEPLOY_URL
    : process.env.FLASK_URL;


const generateDiaryFromImage = async (req, res) => {
  const user_id = req.user?.user_id || req.body.user_id;
  const { companion, feeling, length, tone, weather } = req.body;
  const imageFiles = req.files;

  if (!imageFiles || imageFiles.length === 0) {
    return res.status(400).json({ error: "이미지가 없습니다." });
  }

  try {
    const { dateList, gpsList, locationList, imageMessages } = await extractExifData(imageFiles);

    let tripDateStr, tripDateDB;
    if (dateList.length > 0) {
      dateList.sort((a, b) => a - b);
      const start = dateList[0].toISOString().slice(0, 10);
      const end = dateList[dateList.length - 1].toISOString().slice(0, 10);
      tripDateStr = start === end ? start : `${start} ~ ${end}`;
      tripDateDB = start;
    } else {
      tripDateStr = new Date().toISOString().slice(0, 10);
      tripDateDB = tripDateStr;
    }

    const locationInfo = locationList.length > 0 ? locationList.join(", ") : "";
    const promptText = buildPrompt({ companion, feeling, length, tone, weather }, locationInfo, tripDateStr);
    const diary = await callGPT(promptText, imageMessages);

    const diaryTitle = diary.title;
    const diaryContent = diary.content;

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const [dRes] = await conn.query(
      `INSERT INTO ai_diary_info (user_id, diary_title, diary_content, trip_date)
       VALUES (?, ?, ?, ?)`,

      [user_id, diaryTitle, diaryContent, tripDateDB]
    );
    const diary_idx = dRes.insertId;
    console.log("✅ DB INSERT 시작");

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const { lat, lng, taken_at } = gpsList[i];
      const takenAtToInsert = taken_at || new Date();

      const [pRes] = await conn.query(
        `INSERT INTO photo_info (user_id, file_name, exif_loc, taken_at, tags, lat, lng)
     VALUES (?, ?, ?, ?, '', ?, ?)`,
        [user_id, file.filename, locationInfo, takenAtToInsert, lat, lng]
      );
      console.log("📸 photo_info 삽입 완료:", file.filename);

      const photo_idx = pRes.insertId;

      await conn.query(
        `INSERT INTO ai_diary_photos (diary_idx, photo_idx, created_at)
     VALUES (?, ?, NOW())`,
        [diary_idx, photo_idx]
      );
      console.log("🔗 ai_diary_photos 연결 완료:", photo_idx);
    }

    console.log("✅ DB 커밋 시작");
    await conn.commit();
    conn.release();
    console.log("✅ DB 커밋 완료");

    try {
      console.log("📡 Flask 분류 요청 시작:", `${FLASK_URL}/classify`);
      await axios.post(`${FLASK_URL}/classify`);
      console.log("✔️ Flask 서버로 분류 요청 전송 완료");
    } catch (err) {
      console.warn("❌ Flask 호출 실패:", err.message);
    }


    return res.json({ message: "일기 저장 완료", diary_idx, trip_date: tripDateStr });
  } catch (error) {
    console.error("일기 생성 실패:", error.response?.data || error.message);
    return res.status(500).json({ error: "일기 생성 실패" });
  }
};

const getDiaryById = async (req, res) => {
  const diaryId = req.params.id;
  try {
    const [diaries] = await pool.query("SELECT * FROM ai_diary_info WHERE diary_idx = ?", [diaryId]);
    if (diaries.length === 0) return res.status(404).json({ error: "일기를 찾을 수 없습니다." });
    const diary = diaries[0];

    const [photos] = await pool.query(
      `SELECT p.photo_idx, p.file_name, p.lat, p.lng, p.taken_at, d.diary_title
       FROM ai_diary_photos ap
       JOIN photo_info p ON ap.photo_idx = p.photo_idx
       JOIN ai_diary_info d ON ap.diary_idx = d.diary_idx
       WHERE ap.diary_idx = ?`,

      [diaryId]
    );

    return res.json({ diary, photos });
  } catch (err) {
    console.error("일기 조회 실패:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
};

const getDiaryByPhotoIdx = async (req, res) => {
  const user_id = req.user.user_id;
  const photoIdx = req.params.photoIdx;
  try {
    const [rows] = await pool.query(
      `SELECT d.diary_idx, d.diary_title, d.diary_content, d.trip_date
       FROM ai_diary_photos ap
       JOIN ai_diary_info d ON ap.diary_idx = d.diary_idx
       WHERE ap.photo_idx = ? AND d.user_id = ?`,

      [photoIdx, user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "해당 사진의 일기가 없습니다." });
    return res.json(rows[0]);
  } catch (err) {
    console.error("사진별 일기 조회 실패:", err);
    return res.status(500).json({ message: "일기 조회 실패" });
  }
};

const getAllDiariesByUser = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await pool.query(
      `SELECT d.diary_idx, d.diary_title, d.diary_content, d.trip_date,
              (SELECT p.file_name FROM ai_diary_photos dp LEFT JOIN photo_info p ON dp.photo_idx = p.photo_idx WHERE dp.diary_idx = d.diary_idx ORDER BY dp.created_at ASC LIMIT 1) AS file_name
       FROM ai_diary_info d WHERE d.user_id = ? ORDER BY d.trip_date DESC`,

      [user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "등록된 일기가 없습니다." });
    return res.json(rows);
  } catch (err) {
    console.error("사용자 일기 목록 조회 실패:", err);
    return res.status(500).json({ message: "일기 목록 조회 실패" });
  }
};

const getRandomDiariesByUser = async (req, res) => {
  const user_id = req.user?.user_id;
  if (!user_id) return res.status(401).json({ message: "사용자 인증 실패" });
  try {
    const [rows] = await pool.query(
      `SELECT d.diary_idx, d.diary_title, d.diary_content, d.trip_date,
              (SELECT p.file_name FROM ai_diary_photos dp LEFT JOIN photo_info p ON dp.photo_idx = p.photo_idx WHERE dp.diary_idx = d.diary_idx ORDER BY dp.created_at ASC LIMIT 1) AS file_name
       FROM ai_diary_info d WHERE d.user_id = ? ORDER BY RAND() LIMIT 3`,

      [user_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("❌ 랜덤 일기 조회 실패:", err);
    return res.status(500).json({ message: "랜덤 일기 조회 실패" });
  }
};

const deleteDiary = async (req, res) => {
  const diaryId = req.params.id;
  const user_id = req.user?.user_id || req.body.user_id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [photoRows] = await conn.query(
      `SELECT p.photo_idx FROM ai_diary_photos ap JOIN photo_info p ON ap.photo_idx = p.photo_idx WHERE ap.diary_idx = ? AND p.user_id = ?`,

      [diaryId, user_id]
    );
    const photoIdxList = photoRows.map(row => row.photo_idx);
    await conn.query(`DELETE FROM ai_diary_photos WHERE diary_idx = ?`, [diaryId]);
    if (photoIdxList.length > 0) {
      await conn.query(`DELETE FROM photo_info WHERE photo_idx IN (?) AND user_id = ?`, [photoIdxList, user_id]);
    }
    await conn.query(`DELETE FROM ai_diary_info WHERE diary_idx = ? AND user_id = ?`, [diaryId, user_id]);
    await conn.commit();
    res.json({ message: "일기 삭제 성공" });
  } catch (err) {
    await conn.rollback();
    console.error("일기 삭제 실패:", err);
    res.status(500).json({ error: "일기 삭제 실패" });
  } finally {
    conn.release();
  }
};

const getTimelineByUser = async (req, res) => {
  const user_email = req.query.user_email;
  if (!user_email) {
    return res.status(400).json({ error: "user_email이 필요합니다" });
  }

  try {
    const [photos] = await pool.query(
      `SELECT p.photo_idx, p.file_name, p.taken_at, p.tags, d.diary_title
       FROM photo_info p
       JOIN ai_diary_photos dp ON p.photo_idx = dp.photo_idx
       JOIN ai_diary_info d ON dp.diary_idx = d.diary_idx
       WHERE p.user_id = ?
       ORDER BY p.taken_at ASC`,

      [user_email]
    );

    const timeline = {};
    photos.forEach(photo => {
      const date = photo.taken_at.toISOString().slice(0, 10);
      if (!timeline[date]) timeline[date] = [];
      timeline[date].push(photo);
    });

    const result = Object.entries(timeline).map(([date, photos]) => ({
      title: date,
      photos,
    }));

    res.json(result);
  } catch (err) {
    console.error("타임라인 조회 실패:", err);
    res.status(500).json({ error: "타임라인 조회 실패" });
  }
};

module.exports = {
  generateDiaryFromImage,
  getDiaryById,
  getDiaryByPhotoIdx,
  getAllDiariesByUser,
  getRandomDiariesByUser,
  deleteDiary,
  getTimelineByUser
};
