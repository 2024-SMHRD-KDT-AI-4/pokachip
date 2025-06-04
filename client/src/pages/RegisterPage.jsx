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
 * 회원가입 요청을 보내는 함수.
 * auth.controller.js 의 registerSocial 엔드포인트 (/api/register) 을 호출합니다.
 * userInfo: { user_id, user_name, social_type, access_token }
 */
const registerSocial = async (userInfo, navigate, setError) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/register`,
      userInfo,
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.data.message === '회원가입 되었습니다') {
      setError('회원가입 되었습니다');
    }
  } catch (err) {
    console.error('회원가입 오류:', err.response?.data || err);
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

    // --------------------------------------------------------------------------------
    // 1) 모바일 “implicit redirect” 방식에서 되돌아온 URL 해시( #access_token=... )를 파싱
    //    - 구글: https://tripd.netlify.app/register#access_token=...  
    //    - 카카오: https://tripd.netlify.app/register#access_token=...
    //
    //    그 해시에 붙은 access_token을 이용해 사용자 정보 조회 → registerSocial 호출
    // --------------------------------------------------------------------------------
    const hash = window.location.hash; // "#access_token=abc…&…"
    if (isMobile && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      console.log('⭐️ (Register) 모바일 해시에서 파싱된 accessToken:', accessToken);

      if (accessToken) {
        // 1-1) Google userinfo 조회
        if (location.pathname.includes('/register') && window.location.href.includes('google')) {
          axios
            .get('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then((res) => {
              console.log('⭐️ (Register) 구글 redirect 후 사용자 정보:', res.data);
              const userInfo = {
                user_id: res.data.email,
                user_name: res.data.name,
                social_type: 'google',
                access_token: accessToken,
              };
              registerSocial(userInfo, navigate, setError);
            })
            .catch((err) => {
              console.error('❌ (Register) 구글 사용자 정보 조회 오류:', err.response || err);
              setError('구글 회원가입 실패');
            });
        }
        // 1-2) Kakao userinfo 조회
        else if (location.pathname.includes('/register') && window.location.href.includes('kakao')) {
          axios
            .get('https://kapi.kakao.com/v2/user/me', {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then((res) => {
              console.log('⭐️ (Register) 카카오 redirect 후 사용자 정보:', res.data);
              const userInfo = {
                user_id: res.data.kakao_account?.email,
                user_name: res.data.properties?.nickname,
                social_type: 'kakao',
                access_token: accessToken,
              };
              registerSocial(userInfo, navigate, setError);
            })
            .catch((err) => {
              console.error('❌ (Register) 카카오 사용자 정보 조회 오류:', err.response || err);
              setError('카카오 회원가입 실패');
            });
        }
      }
    }
  }, [isMobile, navigate, location]);

  // ------------------------------------------------------------------------
  // 2) useGoogleLogin 훅을 사용해서, PC(팝업) / 모바일(implicit redirect) 자동 분기
  //    - flow: 'implicit'
  //    - scope: 'openid profile email'
  //    - redirect_uri: 모바일 시 “https://tripd.netlify.app/register” 으로 콜백
  // ------------------------------------------------------------------------
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('⭐️ (Register) tokenResponse:', tokenResponse);
        const accessToken = tokenResponse.access_token;
        console.log('⭐️ (Register) accessToken:', accessToken);

        if (accessToken) {
          const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.log('⭐️ (Register) 즉시 사용자 정보:', res.data);

          const userInfo = {
            user_id: res.data.email,
            user_name: res.data.name,
            social_type: 'google',
            access_token: accessToken,
          };
          registerSocial(userInfo, navigate, setError);
        }
      } catch (err) {
        console.error('❌ (Register) 구글 사용자 정보 오류:', err.response?.data || err);
        setError('구글 회원가입 실패');
      }
    },
    onError: (err) => {
      console.error('❌ (Register) 구글 로그인 자체 실패:', err);
      setError('구글 회원가입 실패');
    },
    flow: isMobile ? 'implicit' : 'popup',
    scope: 'openid profile email',
    redirect_uri: isMobile ? 'https://tripd.netlify.app/register' : undefined,
  });

  // ------------------------------------------------------------------------
  // 3) kakaoLogin 함수: PC → popup, 모바일 → redirect(implicit style)
  //    - flow: implicit token 방식
  // ------------------------------------------------------------------------
  const kakaoLogin = () => {
    if (!window.Kakao) {
      setError('카카오 SDK 로드 실패');
      return;
    }

    if (isMobile) {
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=token&client_id=${
        import.meta.env.VITE_KAKAO_CLIENT_ID
      }&redirect_uri=${encodeURIComponent('https://tripd.netlify.app/register')}&scope=profile_nickname,account_email`;
      window.location.href = kakaoAuthUrl;
    } else {
      window.Kakao.Auth.login({
        scope: 'profile_nickname, account_email',
        success: async () => {
          try {
            const res = await window.Kakao.API.request({ url: '/v2/user/me' });
            console.log('⭐️ (Register) 카카오 사용자 정보(PC 팝업):', res);

            const accessToken = window.Kakao.Auth.getAccessToken();
            const userInfo = {
              user_id: res.kakao_account?.email,
              user_name: res.properties?.nickname,
              social_type: 'kakao',
              access_token: accessToken,
            };
            registerSocial(userInfo, navigate, setError);
          } catch (err) {
            console.error('❌ (Register) 카카오 사용자 정보 오류:', err);
            setError('카카오 회원가입 실패');
          }
        },
        fail: (err) => {
          console.error('❌ (Register) 카카오 로그인 실패:', err);
          setError('카카오 회원가입 실패');
        },
      });
    }
  };

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
        {/* Google 회원가입 버튼 */}
        <button
          onClick={() => googleLogin()}
          className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 shadow"
        >
          <img src="/googleimg.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm text-gray-700">구글로 가입하기</span>
        </button>

        {/* Kakao 회원가입 버튼 */}
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
