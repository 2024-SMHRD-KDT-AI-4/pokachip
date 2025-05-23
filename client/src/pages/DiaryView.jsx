// client/src/pages/DiaryView.jsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function DiaryView() {
  const { id } = useParams();
  const [diary, setDiary] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("로그인이 필요합니다");
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
    return <div className="p-6 text-center">일기를 불러오는 중입니다...</div>;
  }

  if (!diary) {
    return <div className="p-6 text-center text-red-500">일기를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{diary.diary_title}</h1>
      <p className="text-sm text-gray-500 mb-2">여행 날짜: {diary.trip_date}</p>
      <div className="prose mb-6 whitespace-pre-wrap">{diary.diary_content}</div>
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {photos.map((p, idx) => (
            <img
              key={idx}
              src={`http://localhost:5000/uploads/${p.file_name}`}
              alt={`photo-${idx}`}
              className="w-full h-auto rounded"
            />
          ))}
        </div>
      )}
    </div>
  );
}
