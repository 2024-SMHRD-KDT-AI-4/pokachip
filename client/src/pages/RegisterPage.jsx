import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white px-4 flex flex-col items-center justify-center relative">
      {/* 상단: 가운데 로고 */}
      <img src="/logo.png" alt="logo" className="h-8 mb-6" />

      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-gray-600 text-sm"
      >
        ← 뒤로가기
      </button>

      {/* 본문 */}
      <h2 className="text-2xl font-bold mb-8 text-gray-800">회원가입</h2>

      <div className="space-y-4 w-full max-w-xs">
        {/* 구글 회원가입 */}
        <button className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 shadow">
          <img src="/googleimg.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm text-gray-700">구글로 가입하기</span>
        </button>

        {/* 카카오 회원가입 */}
        <button className="flex items-center justify-center gap-2 w-full py-2 rounded bg-[#FEE500] hover:brightness-95 shadow">
          <img src="/kakaoimg.png" alt="Kakao" className="w-5 h-5" />
          <span className="text-sm text-gray-800 font-medium">카카오로 가입하기</span>
        </button>

        {/* 로그인 유도 */}
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
    </div>
  );
}

export default RegisterPage;