import React, { useEffect, useState } from 'react';
import TimelineItem from '../components/TimelineItem';

export default function TimelinePage() {
  const [timelineData, setTimelineData] = useState([]);
  const userData = localStorage.getItem('user');
  let user_email = null;

  if (userData) {
    try {
      user_email = JSON.parse(userData).user_id;
    } catch (e) {
      console.error("❌ 사용자 정보 파싱 실패:", e);
    }
  }

  useEffect(() => {
    if (!user_email) return;

    fetch(`http://localhost:5000/api/timeline?user_email=${user_email}`)
      .then((res) => res.json())
      .then((data) => {
        // ✅ 응답이 배열이 아니어도 values로 변환
        const items = Array.isArray(data) ? data : Object.values(data);
        setTimelineData(items);
      })
      .catch(console.error);
  }, [user_email]);

  return (
    <div className="bg-gradient-to-b from-blue-100 to-white min-h-screen p-6">
      <h1 className="text-xl font-bold mb-6 text-center">📍 나의 여행 타임라인</h1>

      <div className="ml-6 border-l-2 border-blue-300">
        {timelineData.map((item, idx) => (
          <TimelineItem key={idx} title={item.title} photos={item.photos} />
        ))}
      </div>
    </div>
  );
}
