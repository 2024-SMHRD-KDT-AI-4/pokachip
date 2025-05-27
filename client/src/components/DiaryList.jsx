import React from 'react';
import { useNavigate } from 'react-router-dom';

function DiaryList({ diaries }) {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-4 space-y-8 max-h-full">
      {diaries.map((diary, idx) => {
        const isEven = idx % 2 === 1;

        // ✅ diary.diary_idx만 사용하도록 수정
        const diaryId = diary.diary_idx;

        // ✅ console로 확인
        console.log("✅ diaryId:", diaryId, diary);

        return (
          <div
            key={diaryId || idx}
            onClick={() => navigate(`/diary/${diaryId}`)}
            className={`relative bg-white rounded-xl shadow-md py-4 px-5 cursor-pointer hover:shadow-lg transition ${
              isEven ? 'pl-24 text-right' : 'pr-24 text-left'
            }`}
          >
            {/* 썸네일 이미지 */}
            {diary.image && (
              <img
                src={diary.image}
                alt="thumbnail"
                className={`absolute top-[-10px] w-16 h-16 object-cover rounded-xl shadow-md border-2 border-white ${
                  isEven ? 'left-4' : 'right-4'
                }`}
              />
            )}

            {/* 날짜 */}
            <div
              className={`flex items-baseline gap-2 ${
                isEven ? 'justify-end' : 'justify-start'
              }`}
            >
              <p className="text-xl font-bold text-gray-900">{diary.day}</p>
              <div className="flex flex-col text-[11px] leading-none text-gray-400 uppercase">
                <span>{diary.month}</span>
                <span>{diary.year}</span>
              </div>
            </div>

            {/* 내용 */}
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">
              “{diary.content}”
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default DiaryList;
