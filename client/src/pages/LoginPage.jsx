import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaArrowLeftLong } from "react-icons/fa6";

// 🔀 백엔드 로그인 요청 함수 수정: userInfo 대신 code와 social_type을 전송
const loginToBackend = async (code, social_type, login, navigate, setError) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/login`,
      { code, social_type }, // body 수정
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("백엔드 응답:", res.data);

    if (res.data.token) {
      login(res.data.token, res.data.user);
      navigate("/");
    }
  } catch (err) {
    console.error("로그인 실패:", err);
    const msg = err.response?.data?.error || "로그인에 실패했습니다.";
    setError(msg);
  }
};

function LoginPage() { // 🔀 GoogleOAuthProvider 제거로 컴포넌트 구조 단순화
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // ✅ 중복 요청 방지 상태

  // ✅ 리디렉션 후 콜백 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state"); // 어떤 소셜 로그인인지 구분하기 위한 state

    if (code && state) {
      setIsProcessing(true);
      loginToBackend(code, state, login, navigate, setError).finally(() => {
         // URL에서 code, state 파라미터 정리
        window.history.replaceState({}, '', window.location.pathname);
        setIsProcessing(false);
      });
    }
  }, [login, navigate]);

  const handleErrorConfirm = () => {
    if (error.includes("회원이 아닙니다")) {
      navigate("/register");
    } else {
      setError("");
    }
  };

  // ✅ 구글 로그인 (리디렉션 시작)
  const googleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const GOOGLE_REDIRECT_URI = import.meta.env.VITE_MODE === 'production'
      ? import.meta.env.VITE_GOOGLE_REDIRECT_URI_PROD
      : import.meta.env.VITE_GOOGLE_REDIRECT_URI_DEV;
    
    // state 파라미터에 'google'을 담아 나중에 콜백에서 어느 소셜 로그인인지 식별
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile&state=google`;
    window.location.href = authUrl;
  };

  // ✅ 카카오 로그인 (리디렉션 시작)
  const kakaoLogin = () => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const KAKAO_REDIRECT_URI = import.meta.env.VITE_MODE === 'production'
      ? import.meta.env.VITE_KAKAO_REDIRECT_URI_PROD
      : import.meta.env.VITE_KAKAO_REDIRECT_URI_DEV;

    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&state=kakao`;
    window.location.href = authUrl;
  };
  
  // 로딩 중일 때 화면
  if (isProcessing) {
    return <div className="min-h-screen flex items-center justify-center">로그인 처리 중...</div>;
  }

  return (
    <div className="min-h-screen bg-white px-4 flex flex-col items-center justify-center relative">
      <img src="/logo.png" alt="logo" className="h-8 mb-6" />

      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 text-gray-600 text-2xl" aria-label="뒤로가기">
        <FaArrowLeftLong />
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
          <span className="text-sm text-gray-800 font-medium">카카오로 시작하기</span>
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">회원이 아니신가요?</p>
          <button onClick={() => navigate("/register")} className="text-sm text-blue-600 font-semibold hover:underline mt-1">
            회원가입 하러가기
          </button>
        </div>
      </div>

      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <p className="whitespace-pre-line break-keep text-black-600 font-semibold mb-4">{error}</p>
            <button onClick={handleErrorConfirm} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;