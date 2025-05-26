import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function FooterNav({ setView }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleClick = (path, isViewChange = false, requireLogin = true) => {
    if (requireLogin && !token) {
      toast.info("로그인이 필요합니다");
      return;
    }

    if (isViewChange && setView) {
      setView(path); // 내부 view 변경
    } else {
      navigate(path); // 라우팅 이동
    }
  };

  return (
    <nav className="bg-blue-100 p-2 flex justify-around items-center fixed bottom-0 w-full z-50">
      {/* 📋 일기 작성 → 로그인 없이 접근 가능 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("create", true, false)}
      >
        📋
      </button>

      {/* 🖼️ 갤러리 → 로그인 필요 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/gallery", false, true)} // ✅ 갤러리 복구
      >
        🖼️
      </button>

      {/* 👤 마이페이지 → 로그인 필요 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/mypage", false, true)}
      >
        👤
      </button>

      {/* ⚙️ 설정 → 로그인 필요 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/setting", false, true)}
      >
        ⚙️
      </button>
    </nav>
  );
}

export default FooterNav;
