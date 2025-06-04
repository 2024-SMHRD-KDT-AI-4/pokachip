import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

function DiaryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diary, setDiary] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false); // 삭제 모달

  useEffect(() => {
    async function fetchDiary() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/api/diary/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDiary(res.data.diary);
        setPhotos(res.data.photos);
      } catch (err) {
        console.error('일기 불러오기 실패:', err);
      }
    }
    fetchDiary();
  }, [id]);

  function formatDate(dateString) {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`http://localhost:5000/api/diary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        alert("삭제가 완료되었습니다.");
        navigate("/");
      }
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
      setShowModal(false);
    }
  };

  if (!diary) return <p className="text-center mt-10">일기를 불러오는 중입니다...</p>;

  return (
    <div className="min-h-screen bg-white max-w-[420px] mx-auto font-[Pretendard-Regular] relative">

      {/* 🔙 상단 바 (로고 + 뒤로가기) */}
      <div className="sticky top-0 z-20 bg-white px-4 pt-4 pb-2 flex items-center justify-between shadow-sm">
        <button
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold flex items-center justify-center shadow-sm transition"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <img
          src="/logo.png"
          alt="로고"
          className="h-10 mx-auto cursor-pointer absolute left-1/2 -translate-x-1/2"
          onClick={() => navigate("/")}
        />
      </div>

      {/* 📸 사진 캐러셀 */}
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
        <p className="text-sm text-gray-500 mb-4">
          {diary.trip_date.includes("~")
            ? diary.trip_date
            : formatDate(diary.trip_date)}
        </p>

        <div className="flex justify-center gap-6 mb-6 h-6"></div>

        <div className="text-gray-800 whitespace-pre-line leading-relaxed mb-8">
          {diary.diary_content}
        </div>

        <div className="flex justify-center">
          <button
            className="border border-gray-400 text-gray-500 rounded-full px-6 py-2 text-sm transition-colors duration-200 hover:border-sky-500 hover:text-sky-500"
            onClick={() => setShowModal(true)}
          >
            일기 삭제하기
          </button>
        </div>
      </div>

      {/* ❗ 삭제 확인 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm">
            <p className="mb-4 font-semibold text-gray-800">정말 삭제하시겠습니까?</p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setShowModal(false)}
              >
                아니오
              </button>
              <button
                className="bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600"
                onClick={handleDeleteConfirm}
              >
                네
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiaryView;
