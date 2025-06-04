// src/pages/RegisterPage.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { FaArrowLeftLong } from 'react-icons/fa6';

const initKakao = () => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(import.meta.env.VITE_KAKAO_CLIENT_ID);
  }
};

const registerToBackend = async (userInfo, navigate, setError) => {
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
    console.error('회원가입 실패:', err);
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

  useEffect(() => {
    initKakao();

    // 모바일에서 redirect로 돌아올 때 해시(#access_token=...) 파싱
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      console.log('⭐️ (회원가입) 해시에서 파싱된 토큰:', accessToken);

      if (accessToken) {
        axios
          .get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .then((res) => {
            console.log('⭐️ (회원가입) 리디렉션 후 사용자 정보:', res.data);
            const userInfo = {
              user_id: res.data.email,
              user_name: res.data.name,
              social_type: 'google',
              access_token: accessToken,
            };
            registerToBackend(userInfo, navigate, setError);
          })
          .catch((err) => {
            console.error('❌ (회원가입) 리디렉션 후 사용자 정보 오류:', err.response || err);
            setError('구글 회원가입 실패');
          });
      }
    }
  }, [navigate]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const accessToken = tokenResponse.access_token;
        console.log('⭐️ (회원가입) tokenResponse:', tokenResponse);

        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('⭐️ (회원가입) 즉시 사용자 정보:', res.data);

        const userInfo = {
          user_id: res.data.email,
          user_name: res.data.name,
          social_type: 'google',
          access_token: accessToken,
        };
        await registerToBackend(userInfo, navigate, setError);
      } catch (err) {
        console.error('❌ (회원가입) 구글 사용자 정보 오류:', err.response?.data || err);
        setError('구글 회원가입 실패');
      }
    },
    onError: (err) => {
      console.error('❌ (회원가입) 구글 로그인 자체 실패:', err);
      setError('구글 회원가입 실패');
    },
    flow: isMobile ? 'implicit' : 'popup',
    scope: 'openid profile email',                    // ← scope 추가
    redirect_uri: isMobile ? 'https://tripd.netlify.app' : undefined, // ← 정확한 도메인
  });

  const kakaoLogin = () => {
    if (!window.Kakao) return setError('카카오 SDK 로드 실패');

    if (isMobile) {
      // 모바일: redirect 방식
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${
        import.meta.env.VITE_KAKAO_CLIENT_ID
      }&redirect_uri=${encodeURIComponent('https://tripd.netlify.app/kakao-callback')}`;
      window.location.href = kakaoAuthUrl;
    } else {
      // 웹: popup 방식
      window.Kakao.Auth.login({
        scope: 'profile_nickname, account_email',
        success: async () => {
          try {
            const res = await window.Kakao.API.request({ url: '/v2/user/me' });
            console.log('⭐️ (회원가입) 카카오 사용자 정보:', res);
            const userInfo = {
              user_id: res.kakao_account?.email,
              user_name: res.properties?.nickname,
              social_type: 'kakao',
              access_token: window.Kakao.Auth.getAccessToken(),
            };
            await registerToBackend(userInfo, navigate, setError);
          } catch (err) {
            console.error('❌ (회원가입) 카카오 사용자 정보 오류:', err);
            setError('카카오 회원가입 실패');
          }
        },
        fail: (err) => {
          console.error('❌ (회원가입) 카카오 로그인 실패:', err);
          setError('카카오 회원가입 실패');
        },
      });
    }
  };

  const handleErrorConfirm = () => {
    if (
      error.includes('이미 가입된 이메일') ||
      error.includes('회원가입 되었습니다')
    ) {
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
        <button
          onClick={googleLogin}
          className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 shadow"
        >
          <img src="/googleimg.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm text-gray-700">구글로 가입하기</span>
        </button>

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
