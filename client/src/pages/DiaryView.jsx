// client/src/pages/DiaryView.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import PhotoMap from "./PhotoMapForDiary.jsx"; // 지도 컴포넌트 추가

export default function DiaryView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [diary, setDiary] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("로그인이 필요합니다");
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:5000/api/diary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDiary(res.data.diary);
        setPhotos(res.data.photos || []);
      })
      .catch((err) => {
        console.error("일기 불러오기 실패:", err);
        toast.error("일기 불러오기 실패");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p className="text-center mt-10">일기를 불러오는 중입니다...</p>;
  }
  if (!diary) {
    return <p className="text-center mt-10 text-red-500">일기를 찾을 수 없습니다.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 max-w-[420px] mx-auto pb-12 relative font-[Pretendard-Regular]">
      
      {/* 🔝 Sticky Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-white/80 via-blue-50/70 to-blue-100/50 backdrop-blur-md px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/60 hover:bg-white/80 text-gray-700 text-xl font-bold flex items-center justify-center shadow-sm transition"
        >
          ×
        </button>
        <h2 className="text-lg font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">
          📓 나의 여행 일기
        </h2>
      </div>

      {/* 📍 지도 표시 (마커 + 일기 팝업) */}
      {photos.length > 0 && diary && (
        <div className="px-4 mt-4">
          <PhotoMap photos={photos} diary={diary} />
        </div>
      )}

      {/* 📸 Carousel */}
      {photos.length > 0 && (
        <div className="mb-6 px-4">
          <Swiper
            slidesPerView={1}
            spaceBetween={16}
            pagination={{ el: ".custom-pagination", clickable: true }}
            modules={[Pagination]}
            className="rounded-xl shadow-md"
          >
            {photos.map((photo, idx) => (
              <SwiperSlide key={idx}>
                <img
                  src={`http://localhost:5000/uploads/${photo.file_name}`}
                  alt={`diary-photo-${idx}`}
                  className="w-full h-80 object-cover rounded-xl"
                />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="custom-pagination flex justify-center gap-2 mt-2"></div>
        </div>
      )}

      {/* ✏️ Diary Content */}
      <div className="bg-white rounded-xl shadow-md p-6 mx-4">
        <h3 className="text-xl font-bold mb-2">{diary.diary_title}</h3>
        <p className="text-sm text-gray-500 mb-4">{diary.trip_date}</p>
        <div className="text-gray-800 whitespace-pre-line leading-relaxed">
          {diary.diary_content}
        </div>
      </div>
    </div>
  );
}
