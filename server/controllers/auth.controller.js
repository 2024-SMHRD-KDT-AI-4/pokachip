// server/controllers/auth.controller.js

import axios from 'axios';
import jwt from 'jsonwebtoken';
// … 필요한 패키지 import

/**
 * loginSocial
 * - POST /api/login
 * - body: { code?, user_id?, user_name?, social_type, access_token? }
 *
 * social_type이 'google' 이고 code가 넘어오면:
 *   (1) Google code → access_token 교환
 *   (2) access_token → userinfo 조회
 *   (3) 로그인(회원 존재 확인) or 신규 가입(없으면 회원가입)
 *
 * social_type이 'google'이고 access_token이 넘어오면(PC Kakao popup, 혹은 기존 직접 토큰 흐름):
 *   (1) access_token → userinfo 조회
 *   (2) 로그인 or 가입
 *
 * social_type이 'kakao'인 경우도 마찬가지로, implicit token 방식을 사용합니다.
 */

export const loginSocial = async (req, res) => {
  try {
    const { code, social_type, access_token } = req.body;

    let token = access_token; // default: front에서 직접 받은 access_token

    // ─────────────────────────────────────────────────────────────────────────────
    // 1) Google Auth-Code Flow 처리
    //    프론트에서 code가 넘어오면, 아래에서 Google 서버에 token 교환 요청
    // ─────────────────────────────────────────────────────────────────────────────
    if (social_type === 'google' && code) {
      // (A) 구글에 POST 요청해서 code → access_token 교환
      const googleTokenRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: 'https://tripd.netlify.app/login',
          grant_type: 'authorization_code',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      token = googleTokenRes.data.access_token;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2) 사용자 정보(userinfo) 조회
    //    Google인지 Kakao인지에 따라 엔드포인트가 달라집니다.
    // ─────────────────────────────────────────────────────────────────────────────
    let userEmail, userName;

    if (social_type === 'google') {
      // Google 사용자 정보 조회
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      userEmail = userRes.data.email;
      userName = userRes.data.name;
    } else if (social_type === 'kakao') {
      // Kakao 사용자 정보 조회
      const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      userEmail = userRes.data.kakao_account?.email;
      userName = userRes.data.properties?.nickname;
    } else {
      return res.status(400).json({ error: '알 수 없는 social_type' });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3) DB 조회: 해당 이메일 가입 여부 확인
    // ─────────────────────────────────────────────────────────────────────────────
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      // 가입된 회원이 아니면
      return res.status(404).json({ error: '회원이 아닙니다. 회원가입을 진행해주세요.' });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4) JWT 발급 (이미 가입된 회원인 경우) → 프론트에 token + user 정보 리턴
    // ─────────────────────────────────────────────────────────────────────────────
    const payload = { id: user._id, email: user.email };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token: jwtToken,
      user: {
        user_id: user.email,
        user_name: user.name,
      },
    });
  }  catch (err) {
    // 1) err.response가 있으면 상세 데이터를 미리 찍고,
    // 2) err 자체도 콘솔에 남겨서 스택트레이스 전체를 확인할 수 있게 합니다.
    console.error('\n🔴 loginSocial 중 예외 발생! 🔴');
    if (err.response) {
      console.error('▶ err.response.status:', err.response.status);
      console.error('▶ err.response.data:', err.response.data);
    }
    console.error('▶ err (stack):', err.stack || err);
    console.error('──────────────────────────────────────────\n');

    return res.status(500).json({ error: '로그인 과정에서 오류가 발생했습니다.' });
  }
};

/**
 * registerSocial
 * - POST /api/register
 * - body: { code?, user_id?, user_name?, social_type, access_token? }
 *
 * social_type이 'google'이고 code가 있으면: code→access_token→userinfo→DB 저장
 * social_type이 'google'이고 access_token이 있으면: access_token→userinfo→DB 저장
 * social_type이 'kakao'이고 access_token이 있으면: token→userinfo→DB 저장
 */
export const registerSocial = async (req, res) => {
  try {
    const { code, user_id, user_name, social_type, access_token } = req.body;

    let token = access_token;

    // ─────────────────────────────────────────────────────────────────────────────
    // 1) Google Auth-Code Flow 처리
    // ─────────────────────────────────────────────────────────────────────────────
    if (social_type === 'google' && code) {
      const googleTokenRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: 'https://tripd.netlify.app/register',
          grant_type: 'authorization_code',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      token = googleTokenRes.data.access_token;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2) 사용자 정보 조회 (Google 또는 Kakao)
    // ─────────────────────────────────────────────────────────────────────────────
    let userEmail, userNameFetched;

    if (social_type === 'google') {
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      userEmail = userRes.data.email;
      userNameFetched = userRes.data.name;
    } else if (social_type === 'kakao') {
      const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      userEmail = userRes.data.kakao_account?.email;
      userNameFetched = userRes.data.properties?.nickname;
    } else {
      return res.status(400).json({ error: '알 수 없는 social_type' });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3) 이미 가입된 회원인지 확인
    // ─────────────────────────────────────────────────────────────────────────────
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      return res.status(409).json({ error: '이미 가입된 이메일입니다.' });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4) DB에 신규 회원 저장
    // ─────────────────────────────────────────────────────────────────────────────
    const newUser = new User({
      email: userEmail,
      name: userNameFetched,
      socialType: social_type,
      // 필요한 추가 필드가 있으면 여기에 넣습니다.
    });
    await newUser.save();

    return res.json({ message: '회원가입 되었습니다' });
  } catch (err) {
    console.error('registerSocial 에러:', err.response?.data || err);
    return res.status(500).json({ error: '회원가입 과정에서 오류가 발생했습니다.' });
  }
};
