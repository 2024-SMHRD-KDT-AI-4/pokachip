import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaArrowLeftLong } from "react-icons/fa6";

/**
 * 백엔드에 인증 코드를 보내 로그인을 처리하는 함수
 * @param {string} code - 소셜 플랫폼에서 받은 일회용 인증 코드
 * @param {string} social_type - 'google' 또는 'kakao'
 */
const loginToBackend = async (code, social_type, login, navigate, setError) => {
  try {
    // 백엔드의 '/api/login' 엔드포인트로 인증 코드와 소셜 타입을 전송
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/login`,
      { code, social_type },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("백엔드 응답:", res.data);

    // 백엔드로부터 JWT 토큰을 받으면 로그인 처리 후 메인 페이지로 이동
    if (res.data.token) {
      login(res.data.token, res.data.user);
      navigate("/");
    }
  } catch (err) {
    // 로그인 과정에서 에러 발생 시 처리
    console.error("로그인 실패:", err);
    const msg = err.response?.data?.error || "로그인에 실패했습니다.";
    setError(msg); // 에러 메시지를 상태에 저장하여 유저에게 표시
  }
};

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // 로그인 처리 중 상태

  /**
   * 소셜 로그인 후 리디렉션되었을 때 URL의 파라미터를 감지하여 로그인 절차를 시작하는 Hook
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code"); // URL에서 'code' 파라미터 추출
    const state = params.get("state"); // URL에서 'state' 파라미터 추출 (google/kakao 구분)

    // code와 state가 모두 존재할 경우에만 로그인 로직 실행
    if (code && state) {
      setIsProcessing(true); // 처리 중임을 표시
      loginToBackend(code, state, login, navigate, setError)
        .finally(() => {
          // 'invalid_grant' 오류 방지를 위해 요청 완료 후 URL의 파라미터를 정리
          // 이 코드가 없으면 페이지 새로고침 시 동일한 코드가 재전송되어 에러 발생
          window.history.replaceState({}, '', window.location.pathname);
          setIsProcessing(false); // 처리 완료
        });
    }
  }, [login, navigate]); // login, navigate 함수가 변경될 때만 실행

  /**
   * 에러 팝업의 확인 버튼을 눌렀을 때의 동작
   */
  const handleErrorConfirm = () => {
    if (error.includes("회원이 아닙니다")) {
      navigate("/register"); // 비회원일 경우 회원가입 페이지로 이동
    } else {
      setError(""); // 그 외의 에러는 팝업만 닫기
    }
  };

  /**
   * 구글 로그인 버튼 클릭 시 구글 인증 페이지로 리디렉션
   */
  const googleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const GOOGLE_REDIRECT_URI = import.meta.env.VITE_MODE === 'production'
      ? import.meta.env.VITE_GOOGLE_REDIRECT_URI_PROD
      : import.meta.env.VITE_GOOGLE_REDIRECT_URI_DEV;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile&state=google`;
    window.location.href = authUrl;
  };

  /**
   * 카카오 로그인 버튼 클릭 시 카카오 인증 페이지로 리디렉션
   */
  const kakaoLogin = () => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const KAKAO_REDIRECT_URI = import.meta.env.VITE_MODE === 'production'
      ? import.meta.env.VITE_KAKAO_REDIRECT_URI_PROD
      : import.meta.env.VITE_KAKAO_REDIRECT_URI_DEV;

    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&state=kakao`;
    window.location.href = authUrl;
  };

  // 로그인 처리 중일 때 사용자에게 로딩 화면을 보여줌
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