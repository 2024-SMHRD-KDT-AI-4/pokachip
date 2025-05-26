import { toast } from 'react-toastify';

function FooterNav({ setView }) {
  const token = localStorage.getItem("token");

  const handleClick = (view, requireLogin = true) => {
    if (requireLogin && !token) {
      toast.info("로그인이 필요합니다");
      return;
    }

    setView(view);
  };

  return (
    <nav className="bg-blue-100 p-2 flex justify-around items-center fixed bottom-0 w-full z-50">
      {/* 📋 일기 작성 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("create", false)}
      >
        📋
      </button>

      {/* 🖼️ 갤러리 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("gallery", true)} // ✅ gallery로 정확히 연결
      >
        🖼️
      </button>

      {/* 🗺️ 지도 */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("map", true)}
      >
        🗺️
      </button>

      {/* ⚙️ 설정 (추후 구현 가능) */}
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("setting", true)}
      >
        ⚙️
      </button>
    </nav>
  );
}

export default FooterNav;
