import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DiaryList from '../components/DiaryList';
import axios from 'axios';

export default function DiaryListPage() {
  const { isLoggedIn, token } = useAuth();
  const [diaries, setDiaries] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  const baseURL =
    import.meta.env.MODE === "development"
      ? import.meta.env.VITE_API_LOCAL
      : import.meta.env.VITE_API_DEPLOY;

  useEffect(() => {
    if (!isLoggedIn) return;

    axios.get(`${baseURL}/api/diary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setDiaries(res.data))
      .catch((err) => {
        console.error("일기 리스트 불러오기 실패:", err);
      });
  }, [isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white p-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">TRIP DIARY</h1>

      {/* ✅ 처음에만 보이는 버튼 */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => navigate("/diarycreate")}
          className="bg-blue-400 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-500"
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
                ? `${baseURL}/uploads/${d.file_name}`
                : "/default.jpg",
            };
          })}
        />
      )}

      {/* ✅ 스크롤 시 플로팅 버튼 */}
      {isScrolled && (
        <button
          onClick={() => navigate("/diarycreate")}
          className="fixed bottom-6 right-6 bg-blue-400 text-white text-3xl w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-500 z-50"
          aria-label="새 여행 기록"
        >
          +
        </button>
      )}
    </div>
  );
}
