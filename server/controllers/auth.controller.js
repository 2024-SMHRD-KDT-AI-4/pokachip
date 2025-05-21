const jwt = require("jsonwebtoken");
const db = require("../db");
const SECRET_KEY = process.env.JWT_SECRET || "secret123";

// ✅ 소셜 로그인
exports.loginSocial = async (req, res) => {
  const { user_id, social_type, access_token, user_name } = req.body;

  if (!user_id || !social_type || !access_token) {
    return res.status(400).json({ error: "필수 정보 누락" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM user_info WHERE user_id = ?", [user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "회원이 아닙니다. 회원가입을 진행해주세요." });
    }

    const token = jwt.sign({ id: user_id }, SECRET_KEY, { expiresIn: "7d" });

    // ✅ 프론트에 필요한 정보만 깔끔하게 정리해서 전달
    return res.json({
      message: "로그인 성공",
      token,
      user: {
        name: rows[0].user_name,
        email: rows[0].user_id,
        social_type: rows[0].social_type,
      },
    });
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
};

// ✅ 소셜 회원가입
exports.registerSocial = async (req, res) => {
  const { user_id, user_name, social_type, access_token } = req.body;

  console.log("🔐 회원가입 요청값:", { user_id, user_name, social_type, access_token });

  if (!user_id || !user_name || !social_type || !access_token) {
    return res.status(400).json({ error: "필수 정보 누락" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM user_info WHERE user_id = ?", [user_id]);
    if (rows.length > 0) {
      return res.status(409).json({ error: "이미 가입된 이메일입니다." });
    }

    await db.query(
      "INSERT INTO user_info (user_id, user_name, social_type, access_token) VALUES (?, ?, ?, ?)",
      [user_id, user_name, social_type, access_token]
    );

    res.json({ message: "회원가입 되었습니다" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
};
