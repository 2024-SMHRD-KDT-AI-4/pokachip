// src/pages/RegisterPage.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { FaArrowLeftLong } from 'react-icons/fa6';

const initKakao = () => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(import.meta.env.VITE_KAKAO_CLIENT_ID);
  }
};

/**
 * 구글에서 받은 authorization code를 백엔드로 전달하여
 * Google 서버에서 access_token 교환 → userinfo 조회 → 회원가입 처리 요청
 * (auth.controller.js의 registerSocial에 해당)
 */
const registerSocialViaCode = async (code, navigate, setError) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/register`,
      { code, social_type: 'google' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.data.message === '회원가입 되었습니다') {
      setError('회원가입 되었습니다');
    }
  } catch (err) {
    console.error('구글 회원가입(api/register) 실패:', err.response?.data || err);
    if (err.response?.status === 409) {
      setError('이미 가입된 이메일입니다.');
    } else {
      setError('회원가입 실패');
    }
  }
};

function RegisterPageInner() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const location = useLocation();

  useEffect(() => {
    initKakao();

    // ───────────────────────────────────────────────────────────────────────────
    // 1) 모바일 “Auth-Code” 방식에서 되돌아온 URL 처리
    //
    //    예시: https://tripd.netlify.app/register?code=4/XYZ...&scope=...
    //    URLSearchParams로 code를 가져와 registerSocialViaCode(code) 호출
    // ───────────────────────────────────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (isMobile && code) {
      console.log('⭐️ RegisterPage: 모바일에서 받은 code:', code);
      registerSocialViaCode(code, navigate, setError);
    }
  }, [isMobile, navigate, location.key]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2) useGoogleLogin 훅을 “auth-code” 흐름으로 사용
  //    - flow: 'auth-code'
  //    - scope: 'openid profile email'
  //    - redirect_uri: 'https://tripd.netlify.app/register'
  // ───────────────────────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (tokenResponse) => {
      const code = tokenResponse.code;
      console.log('⭐️ RegisterPage: PC에서 받은 tokenResponse.code:', code);
      if (code) {
        await registerSocialViaCode(code, navigate, setError);
      }
    },
    onError: (err) => {
      console.error('❌ RegisterPage: 구글 로그인 자체 실패:', err);
      setError('구글 회원가입 실패');
    },
    scope: 'openid profile email',
    redirect_uri: 'https://tripd.netlify.app/register',
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 카카오 회원가입: PC → popup, 모바일 → implicit redirect 방식
  // ───────────────────────────────────────────────────────────────────────────
  const registerSocialViaKakao = async (accessToken) => {
    try {
      const res = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log('⭐️ RegisterPage: 카카오 사용자 정보:', res.data);

      const userInfo = {
        user_id: res.data.kakao_account?.email,
        user_name: res.data.properties?.nickname,
        social_type: 'kakao',
        access_token: accessToken,
      };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/register`,
        userInfo,
        { headers: { 'Content-Type': 'application/json' } }
      );
      // 성공 메시지를 받으면 모달을 띄운 뒤 “로그인 페이지”로 안내
      setError('회원가입 되었습니다');
    } catch (err) {
      console.error('❌ RegisterPage: 카카오 회원가입 실패:', err.response?.data || err);
      setError('카카오 회원가입 실패');
    }
  };

  const kakaoLogin = () => {
    if (!window.Kakao) {
      setError('카카오 SDK 로드 실패');
      return;
    }

    if (isMobile) {
      // 모바일: implicit token 방식
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=token&client_id=${
        import.meta.env.VITE_KAKAO_CLIENT_ID
      }&redirect_uri=${encodeURIComponent('https://tripd.netlify.app/register')}&scope=profile_nickname,account_email`;
      window.location.href = kakaoAuthUrl;
    } else {
      // PC: popup 방식
      window.Kakao.Auth.login({
        scope: 'profile_nickname, account_email',
        success: async () => {
          try {
            const accessToken = window.Kakao.Auth.getAccessToken();
            console.log('⭐️ RegisterPage: 카카오 팝업 accessToken:', accessToken);
            await registerSocialViaKakao(accessToken);
          } catch (err) {
            console.error('❌ RegisterPage: 카카오 팝업 사용자 정보 오류:', err);
            setError('카카오 회원가입 실패');
          }
        },
        fail: (err) => {
          console.error('❌ RegisterPage: 카카오 팝업 로그인 실패:', err);
          setError('카카오 회원가입 실패');
        },
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 모바일 카카오 implicit 리디렉션 후 해시 파싱
  //    - URL 예시: https://tripd.netlify.app/register#access_token=KAO_TOKEN
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isMobile) {
      const hash = window.location.hash; // "#access_token=xyz123…"
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        console.log('⭐️ RegisterPage: 모바일 카카오 해시 accessToken:', accessToken);
        if (accessToken) {
          registerSocialViaKakao(accessToken);
        }
      }
    }
  }, [isMobile]);

  const handleErrorConfirm = () => {
    if (error.includes('이미 가입된 이메일') || error.includes('회원가입 되었습니다')) {
      navigate('/login');
    } else {
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 flex flex-col items-center justify-center relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-blue-400 text-2xl"
        aria-label="뒤로가기"
      >
        <FaArrowLeftLong />
      </button>

      <h2 className="text-2xl font-bold mb-8 text-gray-800">회원가입</h2>

      <div className="space-y-4 w-full max-w-xs">
        {/* 구글 회원가입 버튼 */}
        <button
          onClick={() => googleLogin()}
          className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 shadow"
        >
          <img src="/googleimg.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm text-gray-700">구글로 가입하기</span>
        </button>

        {/* 카카오 회원가입 버튼 */}
        <button
          onClick={kakaoLogin}
          className="flex items-center justify-center gap-2 w-full py-2 rounded bg-[#FEE500] hover:brightness-95 shadow"
        >
          <img src="/kakaoimg.png" alt="Kakao" className="w-5 h-5" />
          <span className="text-sm text-gray-800 font-medium">카카오로 가입하기</span>
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">이미 계정이 있으신가요?</p>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 font-semibold hover:underline mt-1"
          >
            로그인 하러가기
          </button>
        </div>
      </div>

      {/* 에러 모달 */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <p className="text-black-600 font-semibold mb-4">{error}</p>
            <button
              onClick={handleErrorConfirm}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RegisterPage() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <RegisterPageInner />
    </GoogleOAuthProvider>
  );
}

export default RegisterPage;
