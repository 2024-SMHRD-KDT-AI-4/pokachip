import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

import {
  RiHomeSmileLine,
  RiImageAddLine,
  RiMapPinLine,
  RiUserSmileLine,
  RiBook2Line,
} from "react-icons/ri";

function FooterNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [diaryClicked, setDiaryClicked] = useState(false); // ✅ 중앙 버튼 클릭 상태

  const handleClick = (path, requireLogin = true) => {
    if (requireLogin && !isLoggedIn) {
      setShowModal(true);
      return;
    }
    if (path === "/diarylist") {
      setDiaryClicked(true); // ✅ 클릭 상태 변경
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
          <div className="absolute inset-x-0 flex justify-center -z-0 pointer-events-none">
            <div
              className="bg-white pointer-events-none"
              style={{
                width: "80px",
                height: "40px",
                borderBottomLeftRadius: "40px",
                borderBottomRightRadius: "40px",
              }}
            />
          </div>

          {/* ✅ 중앙 파스텔 버튼 */}
          {/* 수정: 아래 div에 pointer-events-none을 추가하여 클릭 이벤트가 통과되도록 함 */}
          <div className="absolute inset-x-0 -top-8 flex justify-center z-10 pointer-events-none">
            <button
              onClick={() => handleClick("/diarylist")}
              /* 수정: 버튼 자체는 클릭이 되어야 하므로 pointer-events-auto를 추가 */
              className={`pointer-events-auto w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl transition duration-300 ${
                location.pathname === "/diarylist"
                  ? "bg-white text-sky-400"
                  : "bg-sky-300 text-white hover:bg-sky-400"
              }`}
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
            <p className="text-lg font-semibold mb-4">
              로그인이 필요한 기능입니다.
            </p>
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