import React, { useEffect, useState } from 'react';
import TimelineItem from './TimelineItem';
import dayjs from 'dayjs';

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
                const items = Array.isArray(data) ? data : Object.values(data);
                setTimelineData(items);
            })
            .catch(console.error);
    }, [user_id]);

    // ✅ 그룹핑: 날짜 범위로 묶기
    const grouped = {};

    timelineData.forEach((item) => {
        if (!item.photos || item.photos.length === 0) return;

        const timestamps = item.photos.map((p) => new Date(p.taken_at));
        const minDate = dayjs(Math.min(...timestamps));
        const maxDate = dayjs(Math.max(...timestamps));

        const rangeTitle = minDate.isSame(maxDate, 'day')
            ? minDate.format('YYYY.MM.DD')
            : `${minDate.format('YYYY.MM.DD')} ~ ${maxDate.format('YYYY.MM.DD')}`;

        if (!grouped[rangeTitle]) {
            grouped[rangeTitle] = { title: rangeTitle, photos: [], sortKey: maxDate.toDate() };
        }

        grouped[rangeTitle].photos.push(...item.photos);
    });

    const mergedTimeline = Object.values(grouped)
        .map((entry) => ({
            title: entry.title,
            photos: entry.photos.sort((a, b) => new Date(a.taken_at) - new Date(b.taken_at)),
            sortKey: entry.sortKey
        }))
        .sort((a, b) => b.sortKey - a.sortKey); // ✅ 최신 날짜순 정렬 (내림차순)

    return (
        <div className="ml-4">
            {mergedTimeline.length === 0 ? (
                <p className="text-gray-500 text-sm mt-2 ml-2">타임라인이 없습니다.</p>
            ) : (
                mergedTimeline.map((item, idx) => (
                    <TimelineItem key={idx} title={item.title} photos={item.photos} />
                ))
            )}
        </div>
    );
}
