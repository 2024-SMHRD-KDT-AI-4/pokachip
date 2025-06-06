const jwt = require("jsonwebtoken");
const db = require("../db");
const axios = require("axios");

const SECRET_KEY = process.env.JWT_SECRET || "secret123";

/**
 * 헬퍼 함수: 소셜 타입, 인증 코드, 리디렉션 URI를 받아 사용자 정보를 반환
 * @param {string} social_type - 'google' 또는 'kakao'
 * @param {string} code - 일회용 인증 코드
 * @param {string} redirect_uri - 인증에 사용된 리디렉션 URI
 */
const getUserProfile = async (social_type, code, redirect_uri) => {
  let accessToken, userInfo;

  if (social_type === "google") {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri, // ❗ 매개변수로 받은 URI 사용
        grant_type: "authorization_code",
      }
    );
    accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    userInfo = {
      user_id: userResponse.data.email,
      user_name: userResponse.data.name,
      social_type,
    };
  } else if (social_type === "kakao") {
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_CLIENT_ID,
          redirect_uri, // ❗ 매개변수로 받은 URI 사용
          code,
        },
      }
    );
    accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    userInfo = {
      user_id: userResponse.data.kakao_account.email,
      user_name: userResponse.data.properties.nickname,
      social_type,
    };
  } else {
    throw new Error("Unsupported social type");
  }

  return userInfo;
};

// ✅ 소셜 로그인 (리디렉션 방식)
exports.loginSocial = async (req, res) => {
  const { social_type, code } = req.body;

  if (!social_type || !code) {
    return res.status(400).json({ error: "필수 정보 누락" });
  }

  try {
    // ❗ 로그인용 리디렉션 URI를 선택
    const redirect_uri =
      process.env.NODE_ENV === "production"
        ? social_type === "google"
          ? process.env.GOOGLE_REDIRECT_URI_PROD
          : process.env.KAKAO_REDIRECT_URI_PROD
        : social_type === "google"
        ? process.env.GOOGLE_REDIRECT_URI_DEV
        : process.env.KAKAO_REDIRECT_URI_DEV;
    
    // ❗ 선택된 URI를 getUserProfile 함수에 전달
    const userProfile = await getUserProfile(social_type, code, redirect_uri);
    const { user_id } = userProfile;

    const [rows] = await db.query("SELECT * FROM user_info WHERE user_id = ?", [
      user_id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "회원이 아닙니다. 회원가입을 진행해주세요." });
    }

    const token = jwt.sign({ user_id: rows[0].user_id }, SECRET_KEY, {
      expiresIn: "7d",
    });

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
    console.error("소셜 로그인 오류:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: "서버 오류", details: err.response ? err.response.data : null });
  }
};

// ✅ 소셜 회원가입 (리디렉션 방식)
exports.registerSocial = async (req, res) => {
  const { social_type, code } = req.body;

  if (!social_type || !code) {
    return res.status(400).json({ error: "필수 정보 누락" });
  }

  try {
    // ❗ 회원가입용 리디렉션 URI를 선택
    const redirect_uri =
      process.env.NODE_ENV === "production"
        ? social_type === "google"
          ? process.env.GOOGLE_REDIRECT_URI_PROD_REGISTER
          : process.env.KAKAO_REDIRECT_URI_PROD_REGISTER
        : social_type === "google"
        ? process.env.GOOGLE_REDIRECT_URI_DEV_REGISTER
        : process.env.KAKAO_REDIRECT_URI_DEV_REGISTER;

    // ❗ 선택된 URI를 getUserProfile 함수에 전달
    const userProfile = await getUserProfile(social_type, code, redirect_uri);
    const { user_id, user_name } = userProfile;

    const [rows] = await db.query("SELECT * FROM user_info WHERE user_id = ?", [
      user_id,
    ]);
    if (rows.length > 0) {
      return res.status(409).json({ error: "이미 가입된 이메일입니다." });
    }

    await db.query(
      "INSERT INTO user_info (user_id, user_name, social_type) VALUES (?, ?, ?)",
      [user_id, user_name, social_type]
    );

    res.json({ message: "회원가입 되었습니다" });
  } catch (err) {
    console.error("회원가입 오류:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: "서버 오류", details: err.response ? err.response.data : null });
  }
};