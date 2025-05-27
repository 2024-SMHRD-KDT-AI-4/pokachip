import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

function DiaryView() {
  const { id } = useParams();
  const [diary, setDiary] = useState(null);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function fetchDiary() {
      try {
        const token = localStorage.getItem("token"); // ✅ 토큰 꺼내오기
        const res = await axios.get(`http://localhost:5000/api/diary/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ 헤더에 토큰 포함
          },
        });
        setDiary(res.data.diary);
        setPhotos(res.data.photos);
      } catch (err) {
        console.error('일기 불러오기 실패:', err);
      }
    }
    fetchDiary();
  }, [id]);

  // 📌 날짜를 'YYYY-MM-DD' 형식으로 변환
  function formatDate(dateString) {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  if (!diary) return <p className="text-center mt-10">일기를 불러오는 중입니다...</p>;

  return (
    <div className="min-h-screen bg-white max-w-[420px] mx-auto font-[Pretendard-Regular] relative">

      {/* 🔙 상단 고정 바 */}
      <div className="sticky top-0 z-20 bg-white px-4 pt-4 pb-2 flex items-center justify-between shadow-sm">
        <button
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold flex items-center justify-center shadow-sm transition"
          onClick={() => alert('리스트로 이동 예정')}
        >
          ←
        </button>
        <h2 className="text-lg font-bold text-gray-800 mx-auto absolute left-1/2 -translate-x-1/2">📓 나의 여행 일기</h2>
      </div>

      {/* 📸 모든 사진을 정사각형으로 캐러셀 */}
      {photos.length > 0 && (
        <div className="w-full aspect-square mb-4">
          <Swiper
            slidesPerView={1}
            pagination={{ el: '.custom-pagination', clickable: true }}
            modules={[Pagination]}
            className="w-full h-full"
          >
            {photos.map((photo, idx) => (
              <SwiperSlide key={idx}>
                <img
                  src={`http://localhost:5000/uploads/${photo.file_name}`}
                  alt={`diary-photo-${idx}`}
                  className="w-full h-full object-cover"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* 쩜쩜쩜 dot 네비게이션 */}
      <div className="custom-pagination flex justify-center gap-2 mb-6"></div>

      {/* ✏️ 본문 내용 */}
      <div className="px-6 pb-10 text-center">
        <h3 className="text-xl font-bold mb-1">{diary.diary_title}</h3>

        {/* 📅 날짜 포맷 표시 */}
        <p className="text-sm text-gray-500 mb-4">
          {diary.trip_date.includes("~")
            ? diary.trip_date
            : formatDate(diary.trip_date)}
        </p>

        {/* 아이콘 영역 (임시 비움) */}
        <div className="flex justify-center gap-6 mb-6 h-6"></div>

        <div className="text-gray-800 whitespace-pre-line leading-relaxed">
          {diary.diary_content}
        </div>
      </div>
    </div>
  );
}

export default DiaryView;
