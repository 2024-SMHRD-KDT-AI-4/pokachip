const jwt = require("jsonwebtoken");
const db = require("../db");
const axios = require("axios"); // ✅ 서버 간 통신을 위해 axios 추가

const SECRET_KEY = process.env.JWT_SECRET || "secret123";

// 헬퍼 함수: 소셜 타입과 인증 코드를 받아 사용자 정보를 반환
const getUserProfile = async (social_type, code) => {
  let accessToken, userInfo;

  if (social_type === 'google') {
    // 1. 구글로부터 Access Token 받기
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.NODE_ENV === 'production' ? process.env.GOOGLE_REDIRECT_URI_PROD : process.env.GOOGLE_REDIRECT_URI_DEV,
      grant_type: 'authorization_code',
    });
    accessToken = tokenResponse.data.access_token;

    // 2. Access Token으로 사용자 정보 받기
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    userInfo = {
      user_id: userResponse.data.email,
      user_name: userResponse.data.name,
      social_type,
    };
  } else if (social_type === 'kakao') {
    // 1. 카카오로부터 Access Token 받기
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.NODE_ENV === 'production' ? process.env.KAKAO_REDIRECT_URI_PROD : process.env.KAKAO_REDIRECT_URI_DEV,
        code,
      },
    });
    accessToken = tokenResponse.data.access_token;

    // 2. Access Token으로 사용자 정보 받기
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    userInfo = {
      user_id: userResponse.data.kakao_account.email,
      user_name: userResponse.data.properties.nickname,
      social_type,
    };
  } else {
    throw new Error('Unsupported social type');
  }

  // ✅ access_token은 이제 서버에서만 관리하므로, 사용자 정보만 반환
  return userInfo;
};


// ✅ 소셜 로그인 (리디렉션 방식)
exports.loginSocial = async (req, res) => {
  // 🔀 프론트에서 access_token 대신 인증 code를 받음
  const { social_type, code } = req.body;

  if (!social_type || !code) {
    return res.status(400).json({ error: "필수 정보 누락" });
  }

  try {
    // 🔀 인증 코드를 사용하여 소셜 플랫폼에서 사용자 정보 가져오기
    const userProfile = await getUserProfile(social_type, code);
    const { user_id, user_name } = userProfile;

    const [rows] = await db.query("SELECT * FROM user_info WHERE user_id = ?", [user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "회원이 아닙니다. 회원가입을 진행해주세요." });
    }

    const token = jwt.sign({ user_id: rows[0].user_id }, SECRET_KEY, { expiresIn: "7d" });

    return res.json({
      message: "로그인 성공",
      token,
      user: {
        user_id: rows[0].user_id,
        user_name: rows[0].user_name,
        social_type: rows[0].social_type,
      },
    });
  } catch (err) {
    console.error("소셜 로그인 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
};

// ✅ 소셜 회원가입 (리디렉션 방식)
exports.registerSocial = async (req, res) => {
  // 🔀 프론트에서 access_token 대신 인증 code를 받음
  const { social_type, code } = req.body;

  console.log("🔐 회원가입 요청값:", { social_type, code });

  if (!social_type || !code) {
    return res.status(400).json({ error: "필수 정보 누락" });
  }

  try {
    // 🔀 인증 코드를 사용하여 소셜 플랫폼에서 사용자 정보 가져오기
    const userProfile = await getUserProfile(social_type, code);
    const { user_id, user_name } = userProfile;
    
    const [rows] = await db.query("SELECT * FROM user_info WHERE user_id = ?", [user_id]);
    if (rows.length > 0) {
      return res.status(409).json({ error: "이미 가입된 이메일입니다." });
    }

    // 🔀 DB에 access_token을 저장할 필요가 없음
    await db.query(
      "INSERT INTO user_info (user_id, user_name, social_type) VALUES (?, ?, ?)",
      [user_id, user_name, social_type]
    );

    res.json({ message: "회원가입 되었습니다" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
};