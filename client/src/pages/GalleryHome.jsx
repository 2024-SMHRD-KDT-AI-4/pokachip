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

  // ✅ 로그인된 user_id 가져오기
  const userData = localStorage.getItem('user');
  const user_id = userData ? JSON.parse(userData).user_id : null;

  useEffect(() => {
    if (!user_id) return;

    axios
      .get(`http://localhost:5000/api/gallery/summary?user_id=${user_id}`)
      .then((res) => {
        setSummary(res.data); // { people: { count: 3, thumbnail: 'xxx.jpg' }, ... }
      })
      .catch((err) => {
        console.error('📛 요약 데이터 불러오기 실패:', err);
      });
  }, [user_id]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">📁 내 갤러리</h2>
      <div className="grid grid-cols-2 gap-4">
        {tags.map((tag) => {
          const folder = summary[tag];
          const thumbnail = folder?.thumbnail;
          const count = folder?.count || 0;

          return (
            <div
              key={tag}
              className="cursor-pointer"
              onClick={() => navigate(`/gallery/${tag}`)}
            >
              <div className="w-full h-32 bg-gray-200 rounded overflow-hidden">
                {thumbnail ? (
                  <img
                    src={`http://localhost:5000/uploads/${thumbnail}`}
                    alt={tag}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="mt-2 text-left font-semibold">{tagLabels[tag]}</div>
              <div className="text-left text-sm text-gray-600">{count}장</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GalleryHome;