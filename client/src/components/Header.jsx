import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const navigate = useNavigate();
  const { isLoggedIn, logout, user } = useAuth();
  console.log("🧾 Header 렌더링됨, user:", user);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-blue-100 px-4 py-2 shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <img src="/logo.png" alt="logo" className="h-8" />

        <div className="flex items-center gap-[10px]">
          {isLoggedIn ? (
            <>
              <span className="text-sm text-gray-700">
                {user?.user_name || '사용자'}님
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 font-semibold hover:underline"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-blue-700 font-semibold hover:underline"
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/register')}
                className="text-sm text-blue-700 font-semibold hover:underline"
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
