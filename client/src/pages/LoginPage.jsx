import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // 경로가 맞는지 확인해주세요.
import { FaArrowLeftLong } from "react-icons/fa6";

const initKakao = () => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(import.meta.env.VITE_KAKAO_CLIENT_ID);
  }
};

const baseURL =
  window.location.hostname === "localhost"
    ? import.meta.env.VITE_API_LOCAL
    : import.meta.env.VITE_API_DEPLOY;

const loginToBackend = async (userInfo, login, navigate, setError) => {
  try {
    const res = await axios.post(
      `${baseURL}/api/login`,
      userInfo,
      { headers: { "Content-Type": "application/json" } }
    );

    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      login(res.data.token, res.data.user);
      navigate("/");
    }
  } catch (err) {
    const msg = err.response?.data?.error || "로그인에 실패했습니다.";
    setError(msg);
  }
};

function LoginPageInner() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    initKakao();
  }, []);

  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

  const redirectUri = window.location.hostname === "localhost"
    ? "http://localhost:5173"
    : "https://tripd.netlify.app";


  const googleLoginHook = useGoogleLogin({ // 변수명을 googleLogin에서 googleLoginHook으로 변경 (아래 googleLogin 함수와 이름 충돌 방지)
    onSuccess: async (tokenResponse) => {
      try {
        if (isMobile) {
          // 💥 수정: 백엔드에 code와 함께 redirectUri를 전달합니다.
          const res = await axios.post(
            `${baseURL}/api/google-token`,
            {
              code: tokenResponse.code,
              redirect_uri: redirectUri,
            }
          );


          const { user_id, user_name, access_token } = res.data;

          const userInfo = {
            user_id,
            user_name,
            social_type: "google",
            access_token,
          };

          await loginToBackend(userInfo, login, navigate, setError);
        } else {
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
        }
      } catch (err) {
        console.error("구글 사용자 정보 오류", err);
        setError("구글 로그인 실패");
      }
    },
    onError: () => setError("구글 로그인 실패"),
    flow: isMobile ? "auth-code" : "implicit",
  });

  // 실제 버튼에 연결될 함수
  const handleGoogleLoginClick = () => {
    // 모바일에서 로그인 시도 직전의 정확한 URL 확인 (또는 다른 로직)
    console.log("Mobile client window.location.href before Google login:", window.location.href);
    googleLoginHook(); // useGoogleLogin 훅으로 얻은 로그인 함수 호출
  };

  const kakaoLogin = () => {
    if (!window.Kakao) return setError("카카오 SDK 로드 실패");

    window.Kakao.Auth.login({
      scope: "profile_nickname, account_email",
      throughTalk: isMobile,
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
          setError("카카오 로그인 실패");
        }
      },
      fail: () => setError("카카오 로그인 실패"),
    });
  };

  const handleErrorConfirm = () => {
    if (error.includes("회원이 아닙니다")) {
      navigate("/register");
    } else {
      setError("");
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
        <button
          onClick={handleGoogleLoginClick} // 수정된 부분: handleGoogleLoginClick 호출
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

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">회원이 아니신가요?</p>
          <button
            onClick={() => navigate("/register")}
            className="text-sm text-blue-400 font-semibold hover:underline mt-1"
          >
            회원가입 하러가기
          </button>
        </div>
      </div>

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