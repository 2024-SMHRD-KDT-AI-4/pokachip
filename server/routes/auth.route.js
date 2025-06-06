const express = require("express");
const router = express.Router();

// 1. auth.controller.js에서 필요한 함수만 가져옵니다.
const {
  loginSocial,
  registerSocial,
} = require("../controllers/auth.controller");

// 2. 소셜 로그인 요청을 loginSocial 함수가 처리합니다.
// (프론트엔드에서 인증 코드(code)를 이 API로 바로 보냅니다)
router.post("/login", loginSocial);

// 3. 소셜 회원가입 요청을 registerSocial 함수가 처리합니다.
// (프론트엔드에서 인증 코드(code)를 이 API로 바로 보냅니다)
router.post("/register", registerSocial);

// ✅ exchangeGoogleCode와 /google-token 경로는
// ✅ loginSocial, registerSocial에 기능이 통합되어 있으므로 필요 없습니다.

module.exports = router;