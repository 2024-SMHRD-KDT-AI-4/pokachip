const pool = require('../db');

// ✅ 태그별 썸네일 + 사진 개수 반환
exports.getGallerySummary = async (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) return res.status(400).json({ error: 'user_id가 필요합니다.' });

  const tags = ['people', 'landscape', 'food', 'accommodation'];
  const summary = {};

  try {
    for (const tag of tags) {
      // 최신 썸네일 1장
      const [thumbnailRows] = await pool.query(
        `SELECT file_name FROM photo_info
         WHERE user_id = ? AND tags = ?
         ORDER BY taken_at DESC LIMIT 1`,
        [user_id, tag]
      );

      // 개수
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as count FROM photo_info
         WHERE user_id = ? AND tags = ?`,
        [user_id, tag]
      );

      summary[tag] = {
        thumbnail: thumbnailRows[0]?.file_name || null,
        count: countRows[0].count
      };
    }

    res.json(summary);
  } catch (err) {
    console.error('📛 요약 API 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
};

// ✅ 특정 태그의 사진 리스트 반환
exports.getPhotosByTag = async (req, res) => {
  const { tag } = req.params;
  const user_id = req.query.user_id;

  if (!user_id) return res.status(400).json({ error: 'user_id가 필요합니다.' });

  try {
    const [rows] = await pool.query(
      `SELECT photo_idx, file_name FROM photo_info
       WHERE user_id = ? AND tags = ?
       ORDER BY taken_at DESC`,
      [user_id, tag]
    );
    res.json(rows);
  } catch (err) {
    console.error('📛 태그별 사진 목록 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
};
