// src/pages/LoginPage.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeftLong } from 'react-icons/fa6';

const initKakao = () => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(import.meta.env.VITE_KAKAO_CLIENT_ID);
  }
};

/**
 * 구글에서 받은 authorization code를 백엔드로 전달하여
 * Google 서버에서 access_token 교환 → userinfo 조회 → 로그인 처리 요청
 * (auth.controller.js의 loginSocial에 해당)
 */
const loginSocialViaCode = async (code, login, navigate, setError) => {
  try {
    // 백엔드 /api/login 엔드포인트에 { code, social_type: "google" } 로 POST
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/login`,
      { code, social_type: 'google' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.data.token) {
      login(res.data.token, res.data.user);
      navigate('/');
    }
  } catch (err) {
    console.error('구글 로그인(api/login) 실패:', err.response?.data || err);
    const msg = err.response?.data?.error || '구글 로그인 실패';
    setError(msg);
  }
};

function LoginPageInner() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const location = useLocation();

  useEffect(() => {
    initKakao();

    // ───────────────────────────────────────────────────────────────────────────
    // 1) 모바일 “Auth-Code” 방식에서 되돌아온 URL을 처리
    //
    //    예시 URL: https://tripd.netlify.app/login?code=4/ABCDEFGHIJK&scope=...
    //    리디렉션 후, URLSearchParams로 “code”를 가져와서
    //    loginSocialViaCode(code, ...) 함수를 호출합니다.
    // ───────────────────────────────────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (isMobile && code) {
      console.log('⭐️ LoginPage: 모바일에서 받아온 code:', code);
      loginSocialViaCode(code, login, navigate, setError);
    }
  }, [isMobile, login, navigate, location.key]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2) useGoogleLogin 훅을 “auth-code” 흐름으로 사용
  //
  //    - flow: 'auth-code'
  //    - scope: 'openid profile email'
  //    - redirect_uri: 정확히 “https://tripd.netlify.app/login” (Google Console에도 등록)
  //    - PC(팝업) → onSuccess(tokenResponse)에서 tokenResponse.code를 백엔드로 전송
  //    - 모바일 → Google이 자동으로 “https://tripd.netlify.app/login?code=…” 로 리다이렉트
  // ───────────────────────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (tokenResponse) => {
      // PC 팝업 모드에서만 호출됨. tokenResponse.code 에 authorization code가 들어옴.
      const code = tokenResponse.code;
      console.log('✅ LoginPage: PC에서 받은 tokenResponse.code:', code);
      if (code) {
        await loginSocialViaCode(code, login, navigate, setError);
      }
    },
    onError: (err) => {
      console.error('❌ LoginPage: 구글 로그인 자체 오류:', err);
      setError('구글 로그인 실패');
    },
    scope: 'openid profile email',
    redirect_uri: 'https://tripd.netlify.app/login', // Google 콘솔에도 등록
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 카카오 로그인: “popup”(PC) vs “implicit‐token‐redirect”(모바일)
  //    (= Kakao도 token을 해시로 보내주기 때문에, 모바일에서 hash 파싱 필요)
  // ───────────────────────────────────────────────────────────────────────────
  const loginSocialViaKakao = async (accessToken) => {
    try {
      // Kakao accessToken을 사용해 사용자 info 조회
      const res = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log('⭐️ LoginPage: 카카오 사용자 정보:', res.data);

      const userInfo = {
        user_id: res.data.kakao_account?.email,
        user_name: res.data.properties?.nickname,
        social_type: 'kakao',
        access_token: accessToken,
      };
      // auth.controller.js의 loginSocial(req.body)와 동일한 형식으로 POST
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        userInfo,
        { headers: { 'Content-Type': 'application/json' } }
      );
      // 성공 시 backend가 JWT와 user 정보를 응답하므로 useAuth의 login을 호출
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/me`);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      console.error('❌ LoginPage: 카카오 로그인 처리 실패:', err.response?.data || err);
      setError('카카오 로그인 실패');
    }
  };

  const kakaoLogin = () => {
    if (!window.Kakao) {
      setError('카카오 SDK 로드 실패');
      return;
    }

    if (isMobile) {
      // 모바일: implicit token 방식 (redirect_uri에 hash(#access_token=…)로 리턴)
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=token&client_id=${
        import.meta.env.VITE_KAKAO_CLIENT_ID
      }&redirect_uri=${encodeURIComponent('https://tripd.netlify.app/login')}&scope=profile_nickname,account_email`;
      window.location.href = kakaoAuthUrl;
    } else {
      // PC: 팝업 방식
      window.Kakao.Auth.login({
        scope: 'profile_nickname, account_email',
        success: async () => {
          try {
            const accessToken = window.Kakao.Auth.getAccessToken();
            console.log('⭐️ LoginPage: 카카오 팝업으로 받은 accessToken:', accessToken);
            await loginSocialViaKakao(accessToken);
          } catch (err) {
            console.error('❌ LoginPage: 카카오 팝업 사용자 정보 오류:', err);
            setError('카카오 로그인 실패');
          }
        },
        fail: (err) => {
          console.error('❌ LoginPage: 카카오 팝업 로그인 실패:', err);
          setError('카카오 로그인 실패');
        },
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 모바일에서 카카오 implicit redirect 후 해시(#access_token=…)를 파싱
  //    - URL 예시: https://tripd.netlify.app/login#access_token=KAO_TOKEN...
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isMobile) {
      const hash = window.location.hash; // e.g. "#access_token=1234abcd&..."
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        console.log('⭐️ LoginPage: 모바일 카카오 해시에서 파싱된 accessToken:', accessToken);
        if (accessToken) {
          loginSocialViaKakao(accessToken);
        }
      }
    }
  }, [isMobile]);

  const handleErrorConfirm = () => {
    if (error.includes('회원이 아닙니다')) {
      navigate('/register');
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

      <h2 className="text-2xl font-bold mb-8 text-gray-800">로그인</h2>

      <div className="space-y-4 w-full max-w-xs">
        {/* 구글 로그인 버튼 */}
        <button
          onClick={() => googleLogin()}
          className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 shadow"
        >
          <img src="/googleimg.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm text-gray-700">구글로 시작하기</span>
        </button>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={kakaoLogin}
          className="flex items-center justify-center gap-2 w-full py-2 rounded bg-[#FEE500] hover:brightness-95 shadow"
        >
          <img src="/kakaoimg.png" alt="Kakao" className="w-5 h-5" />
          <span className="text-sm text-gray-800 font-medium">카카오로 시작하기</span>
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">회원이 아니신가요?</p>
          <button
            onClick={() => navigate('/register')}
            className="text-sm text-blue-400 font-semibold hover:underline mt-1"
          >
            회원가입 하러가기
          </button>
        </div>
      </div>

      {/* 에러 모달 */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <p className="whitespace-pre-line break-keep text-black-600 font-semibold mb-4">
              {error}
            </p>
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

function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <LoginPageInner />
    </GoogleOAuthProvider>
  );
}

export default LoginPage;
