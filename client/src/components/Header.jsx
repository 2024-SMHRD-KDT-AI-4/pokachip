import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-blue-100 px-4 py-2 shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <img src="/logo.png" alt="logo" className="h-8" />

        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-700 font-semibold hover:underline"
          >
            로그인
          </button>
          <button onClick={() => navigate('/register')}
          className="text-sm text-blue-700 font-semibold hover:underline">
            회원가입
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
