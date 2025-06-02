import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext"; // ✅ context 사용

import {
  RiHomeSmileLine,
  RiImageAddLine,
  RiMapPinLine,
  RiUserSmileLine,
} from "react-icons/ri";

function FooterNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth(); // ✅ 로그인 상태 가져오기

  const [showModal, setShowModal] = useState(false);

  const handleClick = (path, requireLogin = true) => {
    if (requireLogin && !isLoggedIn) {
      setShowModal(true);
      return;
    }
    navigate(path);
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-500 hover:text-blue-600"
      : "text-gray-600 hover:text-gray-800";

  return (
    <>
      <nav className="py-3 px-4 flex justify-around items-center fixed bottom-0 w-full z-50 bg-gray-100 shadow-md">
        <button
          className={`${isActive("/")} text-2xl`}
          onClick={() => handleClick("/", false)}
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

      {/* ✅ 로그인 필요 모달 */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-xl shadow-md text-center w-80">
            <p className="text-lg font-semibold mb-4">로그인이 필요한 기능입니다.</p>
            <div className="flex justify-center gap-4">
              
               <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  setShowModal(false);
                  navigate("/login");
                }}
              >
                로그인
              </button>
             
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FooterNav;
