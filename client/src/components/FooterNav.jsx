import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  RiHomeSmileLine,
  RiImageAddLine,
  RiMapPinLine,
  RiUserSmileLine,
} from 'react-icons/ri';

function FooterNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const handleClick = (path, requireLogin = true) => {
    if (requireLogin && !token) {
      toast.info("로그인이 필요합니다");
      return;
    }
    navigate(path);
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-500 hover:text-blue-600"
      : "text-gray-600 hover:text-gray-800";

  return (
    <nav className="py-3 px-4 flex justify-around items-center fixed bottom-0 w-full z-50 bg-gray-100 shadow-md">
      <button
        className={`${isActive("/")} text-2xl`}
        onClick={() => handleClick("/")}
      >
        <RiHomeSmileLine />
      </button>

      <button
        className={`${isActive("/gallery")} text-2xl`}
        onClick={() => handleClick("/gallery")}
      >
        <RiImageAddLine />
      </button>

      <button
        className={`${isActive("/map")} text-2xl`}
        onClick={() => handleClick("/map")}
      >
        <RiMapPinLine />
      </button>

      <button
        className={`${isActive("/mypage")} text-2xl`}
        onClick={() => handleClick("/mypage")}
      >
        <RiUserSmileLine />
      </button>
    </nav>
  );
}

export default FooterNav;
