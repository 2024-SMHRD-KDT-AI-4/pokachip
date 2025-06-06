import React, { useEffect, useState } from 'react';
import TimelineItem from '../components/TimelineItem';
import { fetchTimelineData } from '../api/timeline'; // 🔁 axios 함수

export default function TimelinePage() {
  const [timeline, setTimeline] = useState({});
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // ✅ 로그인한 사용자 이메일 추출
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const email = parsed.user_id; // user_id가 이메일임
        setUserEmail(email);

        // ✅ axios로 타임라인 요청
        fetchTimelineData(email).then((data) => {
          setTimeline(data);
        });
      } catch (e) {
        console.error('❌ 유저 정보 파싱 실패:', e);
      }
    }
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6 text-center">📍 나의 여행 타임라인</h1>
      {Object.entries(timeline).length === 0 ? (
        <p className="text-center text-gray-400">작성한 일기가 없습니다.</p>
      ) : (
        Object.entries(timeline).map(([diaryIdx, data]) => (
          <TimelineItem key={diaryIdx} title={data.title} photos={data.photos} />
        ))
      )}
    </div>
  );
}
