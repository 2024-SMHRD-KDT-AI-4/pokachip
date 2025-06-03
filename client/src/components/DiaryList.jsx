import React from 'react';
import { useNavigate } from 'react-router-dom';

function DiaryList({ diaries }) {
    const navigate = useNavigate();

    return (
        <div className="px-4 py-4 space-y-8 max-h-full">
            {diaries.map((diary, idx) => {
                const isEven = idx % 2 === 1;
                const diaryId = diary.diary_idx;

                return (
                    <div
                        key={diaryId || idx}
                        onClick={() => navigate(`/diary/${diaryId}`)}
                        className="relative w-full min-h-[200px] py-6 cursor-pointer"
                    >
                        {/* ✅ 이미지 */}
                        {diary.image && (
                            <img
                                src={diary.image}
                                alt="thumbnail"
                                className={`absolute -top-6 ${isEven ? 'left-4' : 'right-4'
                                    } w-28 h-28 object-cover rounded-lg shadow-md border z-10`}
                            />
                        )}

                        {/* ✅ 날짜 */}
                        <div
                            className={`absolute top-1 ${isEven ? 'left-36 text-left' : 'right-36 text-right'
                                }`}
                        >
                            <p className="text-2xl font-bold text-gray-900">{diary.day}</p>
                            <div className="flex gap-1 text-xs uppercase text-gray-400">
                                <span>{diary.month}</span>
                                <span>{diary.year}</span>
                            </div>
                        </div>

                        {/* ✅ 텍스트 박스 */}
                        <div
                            className={`mt-4 mb-0 w-[100%] bg-white rounded-xl shadow-md px-6 py-5 ${isEven ? 'pl-24 text-right' : 'pr-24 text-left'
                                }`}
                        >
                            <p className="text-base font-semibold text-gray-800 mb-1">
                                “{diary.title}”
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-2">
                                {diary.content}
                            </p>
                            {/* ✅ 항상 보이는 더보기 */}
                            <span className="text-blue-400 text-sm mt-1 inline-block font-medium">
                                더보기
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default DiaryList;