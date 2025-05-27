import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import DiarySlidePanel from './DiarySlidePanel'; // 다음 단계에서 만들 예정

function PhotoModal({ photo, onClose }) {
  const [diary, setDiary] = useState(null);

  useEffect(() => {
    if (!photo) return;

    axios
      .get(`http://localhost:5000/api/diary/photo/${photo.photo_idx}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((res) => setDiary(res.data))
      .catch((err) => {
        console.error('❌ 일기 불러오기 실패:', err);
        setDiary(null);
      });
  }, [photo]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl font-bold"
      >
        ✕
      </button>

      <img
        src={`http://localhost:5000/uploads/${photo.file_name}`}
        alt="fullscreen"
        className="max-w-full max-h-[70%] rounded-lg shadow-lg"
      />

      {/* 슬라이드 일기 영역 */}
      <DiarySlidePanel diary={diary} />
    </div>
  );
}

export default PhotoModal;

