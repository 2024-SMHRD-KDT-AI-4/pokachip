// ✅ DiaryView.jsx - 일기 제목, 날짜, 본문 표시 + 단일 일기 화면 (이전/다음 없음)

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function DiaryView() {
  const { id } = useParams();
  const [diary, setDiary] = useState(null);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function fetchDiary() {
      try {
        const res = await axios.get(`http://localhost:5000/api/diary/${id}`);
        setDiary(res.data.diary);
        setPhotos(res.data.photos);
      } catch (err) {
        console.error('일기 불러오기 실패:', err);
      }
    }
    fetchDiary();
  }, [id]);

  if (!diary) return <p className="text-center mt-10">일기를 불러오는 중입니다...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* 📸 사진 표시 (첫 번째 사진만) */}
      {photos.length > 0 && (
        <div className="relative">
          <img
            src={`http://localhost:5000/uploads/${photos[0].file_name}`}
            alt="diary"
            className="w-full h-80 object-cover rounded-md"
          />
        </div>
      )}

      {/* 📝 일기 제목, 날짜, 본문 */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-2">{diary.diary_title}</h2>
        <p className="text-sm text-gray-500 mb-4">{diary.trip_date}</p>
        <div className="whitespace-pre-line leading-relaxed">{diary.diary_content}</div>
      </div>
    </div>
  );
}

export default DiaryView;
