import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function FooterNav({ setView }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleClick = (path, isViewChange = false) => {
    if (!token) {
      toast.info("로그인이 필요합니다");
      return;
    }

    if (isViewChange && setView) {
      setView(path); // 예: "main" 또는 "create"
    } else {
      navigate(path); // 예: /map, /mypage 등
    }
  };

  return (
    <nav className="bg-blue-100 p-2 flex justify-around items-center fixed bottom-0 w-full z-50">
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("create", true)}
      >
        📋
      </button>
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/map")}
      >
        🖼️
      </button>
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/mypage")}
      >
        👤
      </button>
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => handleClick("/setting")}
      >
        ⚙️
      </button>
    </nav>
  );
}

export default FooterNav;
