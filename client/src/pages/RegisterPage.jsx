import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeftLong } from "react-icons/fa6";

/**
 * 백엔드에 인증 코드를 보내 회원가입을 처리하는 함수
 * @param {string} code - 소셜 플랫폼에서 받은 일회용 인증 코드
 * @param {string} social_type - 'google' 또는 'kakao'
 */
const registerToBackend = async (code, social_type, navigate, setError) => {
  try {
    // 백엔드의 '/api/register' 엔드포인트로 인증 코드와 소셜 타입을 전송
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/register`, 
      { code, social_type },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // 회원가입 성공 메시지를 받으면, 사용자에게 알리고 로그인 페이지로 이동하도록 유도
    if (res.data.message === '회원가입 되었습니다') {
      setError("회원가입 되었습니다. 로그인 페이지로 이동합니다.");
    }
  } catch (err) {
    console.error("회원가입 오류:", err);
    // 이미 가입된 사용자인 경우 (409 Conflict)
    if (err.response?.status === 409) {
      setError('이미 가입된 이메일입니다. 로그인 페이지로 이동합니다.');
    } else {
      // 그 외의 서버 에러
      setError('회원가입에 실패했습니다.');
    }
  }
};

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // 회원가입 처리 중 상태

  /**
   * 소셜 로그인 후 리디렉션되었을 때 URL의 파라미터를 감지하여 회원가입 절차를 시작하는 Hook
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code"); // URL에서 'code' 파라미터 추출
    const state = params.get("state"); // URL에서 'state' 파라미터 추출 (google/kakao 구분)

    // code와 state가 모두 존재할 경우에만 회원가입 로직 실행
    if (code && state) {
      setIsProcessing(true); // 처리 중임을 표시
      registerToBackend(code, state, navigate, setError).finally(() => {
        // 'invalid_grant' 오류 방지를 위해 요청 완료 후 URL의 파라미터를 정리
        window.history.replaceState({}, '', window.location.pathname);
        setIsProcessing(false); // 처리 완료
      });
    }
  }, [navigate]); // navigate 함수가 변경될 때만 실행

  /**
   * 에러 팝업의 확인 버튼을 눌렀을 때의 동작
   */
  const handleErrorConfirm = () => {
    // 회원가입 성공 또는 이미 가입된 유저 안내 시, 확인을 누르면 로그인 페이지로 이동
    if (error.includes("이미 가입된 이메일") || error.includes("회원가입 되었습니다")) {
      navigate("/login");
    } else {
      setError(''); // 그 외의 에러는 팝업만 닫기
    }
  };

  /**
   * 구글로 가입 버튼 클릭 시 구글 인증 페이지로 리디렉션
   */
  const googleRegister = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    // 개발/프로덕션 환경에 맞는 리디렉션 URI 선택
    const GOOGLE_REDIRECT_URI = import.meta.env.VITE_MODE === 'production'
      ? import.meta.env.VITE_GOOGLE_REDIRECT_URI_PROD_REGISTER // 프로덕션용 회원가입 URI
      : import.meta.env.VITE_GOOGLE_REDIRECT_URI_DEV_REGISTER; // 개발용 회원가입 URI
      
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile&state=google`;
    window.location.href = authUrl;
  };

  /**
   * 카카오로 가입 버튼 클릭 시 카카오 인증 페이지로 리디렉션
   */
  const kakaoRegister = () => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    // 개발/프로덕션 환경에 맞는 리디렉션 URI 선택
    const KAKAO_REDIRECT_URI = import.meta.env.VITE_MODE === 'production'
      ? import.meta.env.VITE_KAKAO_REDIRECT_URI_PROD_REGISTER // 프로덕션용 회원가입 URI
      : import.meta.env.VITE_KAKAO_REDIRECT_URI_DEV_REGISTER; // 개발용 회원가입 URI
      
    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&state=kakao`;
    window.location.href = authUrl;
  };
  
  // 회원가입 처리 중일 때 사용자에게 로딩 화면을 보여줌
  if (isProcessing) {
    return <div className="min-h-screen flex items-center justify-center">회원가입 처리 중...</div>;
  }

  return (
    <div className="min-h-screen bg-white px-4 flex flex-col items-center justify-center relative">
      <img src="/logo.png" alt="logo" className="h-8 mb-6" />

      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 text-gray-600 text-2xl" aria-label="뒤로가기">
        <FaArrowLeftLong />
      </button>

      <h2 className="text-2xl font-bold mb-8 text-gray-800">회원가입</h2>

      <div className="space-y-4 w-full max-w-xs">
        <button
          onClick={googleRegister}
          className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 shadow"
        >
          <img src="/googleimg.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm text-gray-700">구글로 가입하기</span>
        </button>

        <button
          onClick={kakaoRegister}
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
            <p className="text-black-600 font-semibold mb-4 whitespace-pre-line">{error}</p>
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

export default RegisterPage;