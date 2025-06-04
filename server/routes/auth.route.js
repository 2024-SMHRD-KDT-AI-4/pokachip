const express = require("express");
const router = express.Router();
const {
  loginSocial,
  registerSocial,
  exchangeGoogleCode, // ✅ 추가
} = require("../controllers/auth.controller");

// ✅ 소셜 로그인 및 회원가입
router.post("/login", loginSocial);
router.post("/register", registerSocial);

// ✅ 모바일 구글 로그인: authorization code → access_token → userinfo
router.post("/google-token", exchangeGoogleCode);

module.exports = router;
