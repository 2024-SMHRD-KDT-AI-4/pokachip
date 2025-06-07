import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import TimelineSection from "../components/TimelineSection";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

function MainPage() {
  const navigate = useNavigate();
  const { isLoggedIn, token } = useAuth();
  const [randomDiaries, setRandomDiaries] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      axios
        .get("https://pokachip.onrender.com/api/diary/randomlist", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("✅ 랜덤 일기 응답:", res.data);
          setRandomDiaries(res.data);
        })
        .catch((err) => {
          console.error("랜덤 일기 불러오기 실패:", err);
        });
    }
  }, [isLoggedIn]);

  const exampleDiaries = [
    {
      title: "비 내리는 날의 추억",
      date: "2025-05-22",
      file_name: "/rain.jpg",
    },
    {
      title: "봄날 산책",
      date: "2025-05-21",
      file_name: "/walk.jpg",
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
      ? fileName.startsWith("/")
        ? fileName
        : `https://pokachip.onrender.com/uploads/${fileName}`
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
          className="w-full h-[280px] rounded-xl overflow-hidden shadow-md cursor-pointer"
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full px-2 pt-3 pb-10">
          <p className="text-[36px] font-bold text-gray-800 leading-tight">
            {day}
            <span className="text-sm text-gray-500 font-medium">
              /{month}/{year}
            </span>
          </p>
          <h2 className="text-[18px] font-semibold text-gray-900 leading-snug">
            {title}
          </h2>
        </div>
      </SwiperSlide>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fff] max-w-full mx-auto px-2">
      <div className="px-2 pt-6">
        <h1 className="text-2xl font-bold text-gray-800">DIARY</h1>
      </div>

      <main className="flex-1 overflow-y-scroll hide-scrollbar px-0 py-4 space-y-8">
        {/* ✅ 랜덤 일기 카드 Swiper */}
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={16}
          slidesPerView={1.0}
          centeredSlides={true}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="w-full pb-12"
        >
          {(isLoggedIn && randomDiaries.length > 0
            ? randomDiaries
            : exampleDiaries
          ).map(renderDiaryCard)}
        </Swiper>

        {!isLoggedIn && (
          <div className="text-center text-gray-600 px-4 space-y-5">
            <p className="text-sm">일기를 보려면 로그인이 필요해요!</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-400 text-white text-sm px-4 py-2 rounded-full hover:bg-blue-500"
            >
              로그인하러 가기
            </button>
          </div>
        )}

        {/* ✅ 타임라인 섹션 */}
        {isLoggedIn && (
          <div className="px-4 mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              📍 나의 여행 타임라인
            </h2>
            <TimelineSection />
          </div>
        )}

        {/* ✅ 로그인 모달 */}
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
                  className="px-4 py-1 bg-blue-400 text-white rounded hover:bg-blue-500"
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
