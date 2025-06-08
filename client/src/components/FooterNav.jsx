import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

import {
  RiHomeSmileLine,
  RiImageAddLine,
  RiMapPinLine,
  RiUserSmileLine,
  RiBook2Line, // 중앙 버튼 아이콘
} from "react-icons/ri";

function FooterNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

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
      ? "text-sky-400 "
      : "text-gray-600 hover:text-sky-400";

  return (
    <>
      {/* ✅ 푸터 */}
      <nav className="fixed bottom-0 w-full z-50">
        <div className="relative bg-gray-100 shadow-md">

          {/* ✅ 중앙 파인 배경 */}
          <div className="absolute inset-x-0 -top-2 flex justify-center z-0 pointer-events-none">
            <div
              className="bg-white"
              style={{
                width: "80px",
                height: "40px",
                borderBottomLeftRadius: "40px",
                borderBottomRightRadius: "40px",
              }}
            />
          </div>

          {/* ✅ 중앙 파스텔 버튼 */}
          <div className="absolute inset-x-0 -top-10 flex justify-center z-10">
            <button
              onClick={() => handleClick("/diarylist")}
              className="w-16 h-16 rounded-full bg-sky-300 hover:bg-sky-400 text-white text-3xl shadow-lg flex items-center justify-center"
            >
              <RiBook2Line />
            </button>
          </div>

          {/* ✅ 기존 하단 버튼 4개 */}
          <div className="py-3 px-4 flex justify-around items-center">
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

            <div className="w-16" /> {/* 중앙 버튼 자리 확보용 빈칸 */}

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
          </div>
        </div>
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
                className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded"
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
