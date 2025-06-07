import React, { useEffect, useState } from 'react';
import TimelineItem from './TimelineItem';

export default function TimelineSection() {
  const [timelineData, setTimelineData] = useState([]);

  const userData = localStorage.getItem('user');
  let user_id = null;

  if (userData) {
    try {
      user_id = JSON.parse(userData).user_id; // ✅ DB에서 쓰는 이름
    } catch (e) {
      console.error("❌ 사용자 정보 파싱 실패:", e);
    }
  }

  useEffect(() => {
    if (!user_id) return;

    fetch(`https://pokachip.onrender.com/api/timeline?user_email=${user_id}`)
      .then((res) => res.json())
      .then((data) => {
        // ✅ 핵심 수정: 배열이 아니어도 values로 변환
        const items = Array.isArray(data) ? data : Object.values(data);
        setTimelineData(items);
      })
      .catch(console.error);
  }, [user_id]);

  return (
    <div className="ml-6 border-l-2 border-blue-300">
      {timelineData.length === 0 ? (
        <p className="text-gray-500 text-sm mt-2 ml-2">타임라인이 없습니다.</p>
      ) : (
        timelineData.map((item, idx) => (
          <TimelineItem key={idx} title={item.title} photos={item.photos} />
        ))
      )}
    </div>
  );
}
