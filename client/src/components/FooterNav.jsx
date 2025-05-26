import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function FooterNav() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleClick = (path, requireLogin = true) => {
    if (requireLogin && !token) {
      toast.info("로그인이 필요합니다");
      return;
    }

    navigate(path);
  };

  return (
    <nav className="bg-blue-100 p-2 flex justify-around items-center fixed bottom-0 w-full z-50">
      {/* 📋 일기 작성 → 로그인 없이 가능 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/diarycreate", false)}
      >
        📋
      </button>

      {/* 🖼️ 갤러리 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/gallery")}
      >
        🖼️
      </button>

      {/* 🗺️ 지도 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/map")}
      >
        🗺️
      </button>

      {/* ⚙️ 마이페이지 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/mypage")}
      >
        ⚙️
      </button>
    </nav>
  );
}

export default FooterNav;
