import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import DiaryList from "../components/DiaryList";

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
        <h1 className="text-2xl font-bold text-gray-800">최근 여행 일기</h1>
      </div>

      <main className="flex-1 overflow-y-scroll hide-scrollbar px-0 py-4 space-y-8">
        <Swiper
          modules={[Pagination]}
          spaceBetween={16}
          slidesPerView={1.0}
          centeredSlides={true}
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet custom-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active custom-bullet-active",
          }}
          className="w-full pb-12"
          observer={true}
          observeParents={true}
          style={{ width: "100%" }}
        >
          {(isLoggedIn ? diaries : exampleDiaries).map(renderDiaryCard)}
        </Swiper>

        {!isLoggedIn && (
          <div className="text-center text-gray-600 px-4 space-y-5">
            <p className="text-sm">일기를 보려면 로그인이 필요해요!</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-500 text-white text-sm px-4 py-2 rounded-full hover:bg-blue-600"
            >
              로그인하러 가기
            </button>
          </div>
        )}

        {isLoggedIn && diaries.length === 0 && (
          <div className="text-center text-gray-500 px-4 py-8">
            <p className="text-sm">아직 작성된 일기가 없어요 📝</p>
            <p className="text-sm text-blue-600 font-semibold mt-2">
              첫 여행을 기록해보세요!
            </p>
          </div>
        )}

        {isLoggedIn && (
          <div className="px-4">
            <div
              onClick={() => navigate("/diarycreate")}
              className="bg-blue-50 rounded-xl p-5 flex justify-between items-center shadow-md cursor-pointer mt-6 mb-6"
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

        {isLoggedIn && diaries.length > 0 && (
          <div className="mt-8"> {/* ✅ 마진 추가 */}
            <DiaryList
              diaries={diaries.map((d) => {
                const date = new Date(d.trip_date);
                return {
                  diary_idx: d.diary_idx,
                  day: date.getDate(),
                  month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
                  year: date.getFullYear(),
                  title: d.diary_title,
                  content: d.diary_content?.slice(0, 80) || '',
                  image: d.file_name
                    ? `http://localhost:5000/uploads/${d.file_name}`
                    : "/default.jpg",
                };
              })}
            />
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
