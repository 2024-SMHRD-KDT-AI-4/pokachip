import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const tags = ['people', 'landscape', 'food', 'accommodation'];

const tagTitles = {
  people: '인물',
  landscape: '풍경',
  food: '음식',
  accommodation: '숙소'
};

const tagDescriptions = {
  people: '여행의 얼굴들이 담긴 순간들',
  landscape: '눈에 담고 싶은 풍경의 조각들',
  food: '맛있는 순간들이 가득',
  accommodation: '쉼이 머물렀던 공간들'
};

const tagMessages = {
  people: "사람이 담긴 순간을 가장 많이 기록하셨어요.",
  landscape: "풍경을 담는 걸 좋아하시는 것 같아요.",
  food: "음식을 가장 자주 기록하셨어요. 미식가의 여정이었네요.",
  accommodation: "머무는 공간의 분위기를 자주 남기셨어요."
};

const baseURL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_LOCAL
    : import.meta.env.VITE_API_DEPLOY;

function GalleryHome() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [topTag, setTopTag] = useState(null);

  const userData = localStorage.getItem('user');
  const user_id = userData ? JSON.parse(userData).user_id : null;

  useEffect(() => {
    if (!user_id) return;

    axios
      .get(`${baseURL}/api/gallery/summary?user_id=${user_id}`)
      .then((res) => {
        setSummary(res.data);

        const sorted = Object.entries(res.data).sort(
          (a, b) => (b[1]?.count || 0) - (a[1]?.count || 0)
        );
        if (sorted.length > 0) {
          setTopTag({ name: sorted[0][0], ...sorted[0][1] });
        }
      })
      .catch((err) => {
        console.error('📛 요약 데이터 불러오기 실패:', err);
      });
  }, [user_id]);

  return (
    <div className="p-4 max-w-[420px] mx-auto bg-white min-h-screen">
      <h1 className="text-center text-2xl font-semibold mb-6">GALLERY</h1>

      {/* ✅ 상단 대표 카드 */}
      {topTag && (
        <div
          className="flex h-28 mb-6 rounded-lg border overflow-hidden cursor-pointer shadow-sm"
          onClick={() => navigate(`/gallery/${topTag.name}`)}
        >
          <div className="w-3/5 bg-white px-4 py-3 flex flex-col justify-center">
            <div className="text-xs text-sky-600 font-semibold mb-1 tracking-wide">
              {tagDescriptions[topTag.name]}
            </div>
            <div className="text-[13px] text-gray-700 leading-snug">
              {tagMessages[topTag.name]}
            </div>
          </div>
          <div className="w-2/5 h-full">
            {topTag.thumbnail ? (
              <img
                src={`${baseURL}/uploads/${topTag.thumbnail}`}
                alt={topTag.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                이미지 없음
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ 폴더 카드 목록 */}
      <div className="grid grid-cols-2 gap-4">
        {tags.map((tag, idx) => {
          const folder = summary[tag];
          const thumbnail = folder?.thumbnail;
          const count = folder?.count || 0;

          const cardClass = `relative h-44 rounded-xl overflow-hidden cursor-pointer ${idx % 2 === 1 ? 'translate-y-6' : ''
            }`;

          return (
            <div
              key={tag}
              className={cardClass}
              onClick={() => navigate(`/gallery/${tag}`)}
            >
              {thumbnail ? (
                <img
                  src={`${baseURL}/uploads/${thumbnail}`}
                  alt={tag}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                  이미지 없음
                </div>
              )}
              <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white text-sm px-3 py-2">
                <div className="font-semibold">{tagTitles[tag]}</div>
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
