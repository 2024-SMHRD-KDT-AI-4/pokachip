import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DiaryList from '../components/DiaryList';
import axios from 'axios';

export default function DiaryListPage() {
  const { isLoggedIn, token } = useAuth();
  const [diaries, setDiaries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) return;

    axios.get("https://pokachip.onrender.com/api/diary", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => setDiaries(res.data))
    .catch((err) => {
      console.error("일기 리스트 불러오기 실패:", err);
    });
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold text-center mb-6">📝 나의 여행일기</h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => navigate("/diarycreate")}
          className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-600"
        >
          + 새 여행 기록하기
        </button>
      </div>

      {diaries.length === 0 ? (
        <p className="text-center text-gray-500">작성한 일기가 없습니다.</p>
      ) : (
        <DiaryList
          diaries={diaries.map((d) => {
            const date = new Date(d.trip_date);
            return {
              diary_idx: d.diary_idx,
              day: date.getDate(),
              month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
              year: date.getFullYear(),
              title: d.diary_title,
              content: d.diary_content?.slice(0, 65) || '',
              image: d.file_name
                ? `https://pokachip.onrender.com/uploads/${d.file_name}`
                : "/default.jpg",
            };
          })}
        />
      )}
    </div>
  );
}
