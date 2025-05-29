import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiLoginBoxLine, RiUserAddLine } from 'react-icons/ri'; // 아이콘 변경

function Header() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  return (
    <header className="px-4 py-2 sticky top-0 z-50 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* ✅ 로고 클릭 시 홈으로 이동 */}
        <img
          src="/logo.png"
          alt="logo"
          className="h-14 cursor-pointer"
          onClick={() => navigate('/')}
        />
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            null
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-700 text-2xl hover:text-black"
                aria-label="로그인"
              >
                <RiLoginBoxLine />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="text-gray-700 text-2xl hover:text-black"
                aria-label="회원가입"
              >
                <RiUserAddLine />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
