import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const initKakao = () => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(import.meta.env.VITE_KAKAO_CLIENT_ID);
  }
};

const loginToBackend = async (userInfo, login, navigate, setError) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/login`,
      userInfo,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("백엔드 응답:", res.data);

    if (res.data.token) {
      login(res.data.token);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    }
  } catch (err) {
    console.error(err);
    setError("로그인에 실패했습니다.");
  }
};

function LoginPageInner() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    initKakao();
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const accessToken = tokenResponse.access_token;
        const res = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const userInfo = {
          user_id: res.data.email,
          user_name: res.data.name,
          social_type: "google",
          access_token: accessToken,
        };

        await loginToBackend(userInfo, login, navigate, setError);
      } catch (err) {
        console.error("구글 사용자 정보 오류", err);
        setError("구글 로그인 실패");
      }
    },
    onError: () => setError("구글 로그인 실패"),
    flow: "implicit",
  });

  const kakaoLogin = () => {
    if (!window.Kakao) return setError("카카오 SDK 로드 실패");

    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent); // ✅ 모바일 감지

    window.Kakao.Auth.login({
      scope: "profile_nickname, account_email",
      throughTalk: isMobile, // ✅ 모바일일 경우에만 앱 실행 시도
      success: async () => {
        try {
          const res = await window.Kakao.API.request({ url: "/v2/user/me" });

          const userInfo = {
            user_id: res.kakao_account?.email,
            user_name: res.properties?.nickname,
            social_type: "kakao",
            access_token: window.Kakao.Auth.getAccessToken(),
          };

          await loginToBackend(userInfo, login, navigate, setError);
        } catch (err) {
          console.error("카카오 사용자 정보 오류", err);
          setError("카카오 로그인 실패");
        }
      },
      fail: (err) => {
        console.error("카카오 로그인 실패", err);
        setError("카카오 로그인 실패");
      },
    });
  };

  return (
    <div className="min-h-screen bg-white px-4 flex flex-col items-center justify-center relative">
      <img src="/logo.png" alt="logo" className="h-8 mb-6" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-gray-600 text-sm"
      >
        ← 뒤로가기
      </button>

      <h2 className="text-2xl font-bold mb-8 text-gray-800">로그인</h2>

      <div className="space-y-4 w-full max-w-xs">
        <button
          onClick={googleLogin}
          className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 shadow"
        >
          <img src="/googleimg.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm text-gray-700">구글로 시작하기</span>
        </button>

        <button
          onClick={kakaoLogin}
          className="flex items-center justify-center gap-2 w-full py-2 rounded bg-[#FEE500] hover:brightness-95 shadow"
        >
          <img src="/kakaoimg.png" alt="Kakao" className="w-5 h-5" />
          <span className="text-sm text-gray-800 font-medium">
            카카오로 시작하기
          </span>
        </button>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/register")}
            className="text-sm text-blue-600 font-semibold hover:underline mt-1"
          >
            회원가입 하러가기
          </button>
        </div>
      </div>
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
