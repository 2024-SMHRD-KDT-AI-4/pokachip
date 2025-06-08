import React, { useState } from 'react';
import ImageModal from './ImageModal';
import dayjs from 'dayjs';

export default function TimelineItem({ title, photos }) {
    const [showPhotos, setShowPhotos] = useState(false);
    const [modalImage, setModalImage] = useState(null);

    return (
        <div className="mb-20 ml-4"> {/* ✅ 마지막 사진과 푸터 사이 여유 공간 추가 */}
           <img
  src="/logomarker.png"
  alt="Logo Marker"
  className="w-5 h-5 mr-2 object-contain"
/>

            <div className="flex items-center cursor-pointer mb-2" onClick={() => setShowPhotos(!showPhotos)}>
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>

            {showPhotos && (
                <div className="ml-4 pl-4 flex flex-col gap-6">
                    {photos.map((photo, index) => (
                        <div key={index} className="flex flex-col items-center relative">
                            {/* ✅ 썸네일 */}
                            <img
                                src={`http://localhost:5000/uploads/${photo.file_name}`}
                                alt="photo"
                                className="w-72 h-48 object-cover rounded shadow cursor-pointer"
                                onClick={() => setModalImage(`http://localhost:5000/uploads/${photo.file_name}`)}
                            />

                            {/* ✅ 날짜 + 시간 */}
                            <div className="text-xs text-gray-500 mt-1 text-center">
                                {dayjs(photo.taken_at).format('YYYY.MM.DD HH:mm')}
                            </div>

                            {/* ✅ 일기 제목 (작은 글씨로 날짜 아래에) */}
                            <div className="text-xs text-gray-700 text-center">
                                {photo.diary_title || ''}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ✅ 모달 */}
            {modalImage && (
                <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
            )}
        </div>
    );
}