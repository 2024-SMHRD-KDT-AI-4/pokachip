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
 * 로그인 요청을 보내는 함수.
 * auth.controller.js 의 loginSocial 엔드포인트 (/api/login) 을 호출합니다.
 * userInfo: { user_id, user_name, social_type, access_token }
 */
const loginSocial = async (userInfo, login, navigate, setError) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/login`,
      userInfo,
      { headers: { 'Content-Type': 'application/json' } }
    );
    // 응답에 token, user 객체가 담겨 옵니다.
    if (res.data.token) {
      login(res.data.token, res.data.user);
      navigate('/');
    }
  } catch (err) {
    console.error('로그인 오류:', err.response?.data || err);
    const msg = err.response?.data?.error || '로그인에 실패했습니다.';
    setError(msg);
  }
};

function LoginPageInner() {
  const navigate = useNavigate();
  // useAuth 훅에서 제공하는 login 함수 (JWT를 저장하고 context에 사용자 정보 세팅)
  const { login } = useAuth();
  const [error, setError] = useState('');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const location = useLocation();

  useEffect(() => {
    initKakao();

    // --------------------------------------------------------------------------------
    // 1) 모바일 “implicit redirect” 방식에서 되돌아온 URL 해시( #access_token=... )를 파싱
    //    - URL 예시: https://tripd.netlify.app/login#access_token=abcdefg123…&token_type=Bearer&…
    //    - hash 안에 ‘access_token’이 있으면 거기에서 추출하여 구글 사용자 정보 조회 → 로그인
    // --------------------------------------------------------------------------------
    const hash = window.location.hash; // "#access_token=abc…&…"
    if (isMobile && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1)); // “#” 제거
      const accessToken = params.get('access_token');
      console.log('⭐️ (Login) 모바일 해시에서 파싱된 accessToken:', accessToken);

      if (accessToken) {
        // Google 사용자 정보 조회
        axios
          .get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .then((res) => {
            console.log('⭐️ (Login) 구글 redirect 후 사용자 정보:', res.data);
            const userInfo = {
              user_id: res.data.email,
              user_name: res.data.name,
              social_type: 'google',
              access_token: accessToken,
            };
            loginSocial(userInfo, login, navigate, setError);
          })
          .catch((err) => {
            console.error('❌ (Login) 구글 사용자 정보 조회 오류:', err.response || err);
            setError('구글 로그인 실패');
          });
      }
    }

    // --------------------------------------------------------------------------------
    // 2) 모바일 카카오 “code” 방식에서 되돌아온 경우: (만일 카카오도 authorization code를 쓰도록 설정했다면)
    //    URL: https://tripd.netlify.app/login?code=KAUTH_CODE…
    //    이 예제에서는 “redirect” 대신에도 implicit 방식(토큰)으로 사용하므로 별도 코드 처리하지 않습니다.
    // --------------------------------------------------------------------------------
  }, [isMobile, login, navigate, location.key]);

  // ------------------------------------------------------------------------
  // 3) useGoogleLogin 훅을 사용해서, PC(팝업) / 모바일(implicit redirect) 자동 분기
  //    - flow: 'implicit' (팝업 → tokenResponse.access_token 직접 반환)
  //    - scope: 'openid profile email' 을 반드시 넣어야 userinfo 권한이 담긴 토큰이 옴
  //    - redirect_uri: 모바일 시 “https://tripd.netlify.app/login” 으로 콜백 (반드시 Google Console에도 등록)
  // ------------------------------------------------------------------------
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('✅ (Login) tokenResponse:', tokenResponse);
        const accessToken = tokenResponse.access_token;
        console.log('✅ (Login) accessToken:', accessToken);

        // Popup 방식(PC) 에서는 access_token이 즉시 내려오는데, 모바일 implicit에서도 아래 로직은 필요 없습니다.
        if (accessToken) {
          const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.log('✅ (Login) 즉시 사용자 정보 응답:', res.data);

          const userInfo = {
            user_id: res.data.email,
            user_name: res.data.name,
            social_type: 'google',
            access_token: accessToken,
          };
          loginSocial(userInfo, login, navigate, setError);
        }
      } catch (err) {
        console.error('❌ (Login) 구글 사용자 정보 오류:', err.response?.data || err);
        setError('구글 로그인 실패');
      }
    },
    onError: (err) => {
      console.error('❌ (Login) 구글 로그인 자체 실패:', err);
      setError('구글 로그인 실패');
    },
    flow: isMobile ? 'implicit' : 'popup',
    scope: 'openid profile email',
    redirect_uri: isMobile ? 'https://tripd.netlify.app/login' : undefined,
  });

  // ------------------------------------------------------------------------
  // 4) kakaoLogin 함수: PC → popup, 모바일 → redirect(implicit style)
  //    (이 예제에서는 카카오도 token 직접 받아오는 implicit 방식으로 가정)
  // ------------------------------------------------------------------------
  const kakaoLogin = () => {
    if (!window.Kakao) {
      setError('카카오 SDK 로드 실패');
      return;
    }

    if (isMobile) {
      // 모바일 리디렉션: 토큰 받아오는 implicit 방식
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=token&client_id=${
        import.meta.env.VITE_KAKAO_CLIENT_ID
      }&redirect_uri=${encodeURIComponent('https://tripd.netlify.app/login')}&scope=profile_nickname,account_email`;
      window.location.href = kakaoAuthUrl;
    } else {
      // PC 팝업 방식
      window.Kakao.Auth.login({
        scope: 'profile_nickname, account_email',
        success: async () => {
          try {
            const res = await window.Kakao.API.request({ url: '/v2/user/me' });
            console.log('⭐️ (Login) 카카오 사용자 정보(PC 팝업):', res);

            const accessToken = window.Kakao.Auth.getAccessToken();
            const userInfo = {
              user_id: res.kakao_account?.email,
              user_name: res.properties?.nickname,
              social_type: 'kakao',
              access_token: accessToken,
            };
            loginSocial(userInfo, login, navigate, setError);
          } catch (err) {
            console.error('❌ (Login) 카카오 사용자 정보 오류:', err);
            setError('카카오 로그인 실패');
          }
        },
        fail: (err) => {
          console.error('❌ (Login) 카카오 로그인 실패:', err);
          setError('카카오 로그인 실패');
        },
      });
    }
  };

  // 에러 확인 버튼 눌렀을 때 분기 처리
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
        {/* Google 로그인 버튼 */}
        <button
          onClick={() => googleLogin()}
          className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 shadow"
        >
          <img src="/googleimg.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm text-gray-700">구글로 시작하기</span>
        </button>

        {/* Kakao 로그인 버튼 */}
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
