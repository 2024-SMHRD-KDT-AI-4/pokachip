import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

function MainPage() {
  const navigate = useNavigate();
  const { isLoggedIn, token } = useAuth();
  const [diaries, setDiaries] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      axios
        .get("http://localhost:5000/api/diary", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setDiaries(res.data))
        .catch((err) => {
          console.error("일기 목록 불러오기 실패:", err);
        });
    }
  }, [isLoggedIn]);

  const exampleDiaries = [
    {
      title: "비 내리는 날의 추억",
      date: "2025-05-22",
      file_name: null,
    },
    {
      title: "봄날 산책",
      date: "2025-05-21",
      file_name: null,
    },
  ];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return { day, month, year };
  };

  const renderDiaryCard = (data, idx) => {
    const { day, month, year } = formatDate(data.date || data.trip_date);
    const title = data.title || data.diary_title;
    const fileName = data.file_name;
    const diaryId = data.diary_idx;

    const image = fileName
      ? `http://localhost:5000/uploads/${fileName}`
      : "/default-image.jpg";

    const handleCardClick = () => {
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      navigate(`/diary/${diaryId}`);
    };

    return (
      <SwiperSlide key={idx} className="flex flex-col items-center space-y-2 px-4">
        <div
          onClick={handleCardClick}
          className="w-full h-[280px] sm:h-[320px] md:h-[360px] rounded-xl overflow-hidden shadow-md cursor-pointer"
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full px-2 pt-3 pb-10">
          <p className="text-[24px] sm:text-[28px] font-bold text-gray-800 leading-tight">
            {day}
            <span className="text-sm text-gray-500 font-medium">
              /{month}/{year}
            </span>
          </p>
          <h2 className="text-[14px] sm:text-[15px] font-semibold text-gray-900 leading-snug">
            {title}
          </h2>
        </div>
      </SwiperSlide>
    );
  };


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fff] max-w-full sm:max-w-[420px] mx-auto px-2">
      <div className="px-2 pt-6">
        <h1 className="text-2xl font-bold text-gray-800">최근 여행 일기</h1>
      </div>

      <main className="flex-1 overflow-y-auto px-0 py-4 space-y-6">
        <Swiper
          modules={[Pagination]}
          spaceBetween={16}
          slidesPerView={1.0}
          centeredSlides={true}
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet custom-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active custom-bullet-active"
          }}
          className="w-full pb-12"
          observer={true}
          observeParents={true}
          style={{ width: "100%" }}
        >
          {(!isLoggedIn ? exampleDiaries : diaries).map(renderDiaryCard)}
        </Swiper>

        {(!isLoggedIn || diaries.length === 0) && (
          <div className="px-4">
            <div
              onClick={() => {
                if (!isLoggedIn) {
                  setShowLoginModal(true);
                } else {
                  navigate("/diarycreate");
                }
              }}
              className="bg-blue-50 rounded-xl p-4 flex justify-between items-center shadow-md cursor-pointer"
            >
              <p className="text-gray-800 font-semibold">
                여행을 기록해볼까요?
              </p>
              <div className="bg-blue-500 text-white text-xl rounded-full w-9 h-9 flex items-center justify-center hover:bg-blue-600">
                +
              </div>
            </div>
          </div>
        )}

        {isLoggedIn && diaries.length > 0 && (
          <div className="px-4">
            <div
              onClick={() => navigate("/diarycreate")}
              className="bg-blue-50 rounded-xl p-4 flex justify-between items-center shadow-md cursor-pointer"
            >
              <p className="text-gray-800 font-semibold">
                새로운 여행을 기록해볼까요?
              </p>
              <div className="bg-blue-500 text-white text-xl rounded-full w-9 h-9 flex items-center justify-center hover:bg-blue-600">
                +
              </div>
            </div>
          </div>

        )}

        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[320px] text-center">
              <p className="text-gray-800 text-lg font-semibold mb-4">
                로그인이 필요한 기능입니다.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-1 bg-gray-300 rounded hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate("/login");
                  }}
                  className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  로그인
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MainPage;
