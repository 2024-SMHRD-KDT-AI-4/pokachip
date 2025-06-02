import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const tags = ['people', 'landscape', 'food', 'accommodation'];
const tagLabels = {
  people: '인물',
  landscape: '풍경',
  food: '음식',
  accommodation: '숙소'
};

function GalleryHome() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});

  const userData = localStorage.getItem('user');
  const user_id = userData ? JSON.parse(userData).user_id : null;

  useEffect(() => {
    if (!user_id) return;

    axios
      .get(`http://localhost:5000/api/gallery/summary?user_id=${user_id}`)
      .then((res) => {
        setSummary(res.data);
      })
      .catch((err) => {
        console.error('📛 요약 데이터 불러오기 실패:', err);
      });
  }, [user_id]);

  return (
    <div className="p-4 max-w-[420px] mx-auto bg-white min-h-screen">
      {/* ✅ 상단 정보 카드 (위 여백 mt-6 추가) */}
      <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
        <div className="text-center p-4 rounded-xl border">
          <p className="text-sm text-gray-500">ketogenic</p>
          <p className="text-xl font-bold">0/20</p>
        </div>
        <div className="text-center p-4 rounded-xl border">
          <p className="text-sm text-gray-500">moderate</p>
          <p className="text-xl font-bold">20/50</p>
        </div>
      </div>

      {/* ✅ 폴더 카드 목록 */}
      <div className="grid grid-cols-2 gap-4">
        {tags.map((tag, idx) => {
          const folder = summary[tag];
          const thumbnail = folder?.thumbnail;
          const count = folder?.count || 0;

          const cardClass = `relative h-44 rounded-xl overflow-hidden cursor-pointer ${
            idx % 2 === 1 ? 'translate-y-6' : ''
          }`;

          return (
            <div
              key={tag}
              className={cardClass}
              onClick={() => navigate(`/gallery/${tag}`)}
            >
              {thumbnail ? (
                <img
                  src={`http://localhost:5000/uploads/${thumbnail}`}
                  alt={tag}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                  이미지 없음
                </div>
              )}
              <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white text-sm px-3 py-2">
                <div className="font-semibold">{tagLabels[tag]}</div>
                <div>{count}장</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GalleryHome;
