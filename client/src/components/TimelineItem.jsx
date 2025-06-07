import React, { useState } from 'react';
import ImageModal from './ImageModal';
import dayjs from 'dayjs';

export default function TimelineItem({ title, photos }) {
    const [showPhotos, setShowPhotos] = useState(false);
    const [modalImage, setModalImage] = useState(null);

    return (
        <div className="mb-6 ml-4">
            {/* 타이틀 + 로고마커 */}
            <div className="flex items-center cursor-pointer mb-2" onClick={() => setShowPhotos(!showPhotos)}>
                {/* 🔁 로고 마커로 교체 */}
                <img
                    src="/logomarker.png"
                    alt="Logo Marker"
                    className="w-5 h-5 mr-2 object-contain"
                />
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>

            {/* ✅ 세로선 삭제됨 */}

            {showPhotos && (
                <div className="ml-4 pl-4 flex flex-col gap-6"> {/* border-l 제거됨 */}
                    {photos.map((photo, index) => (
                        <div key={index} className="flex flex-col items-center relative">
                            {/* ✅ 태그 마커 */}
                            <img
                                src={`/${photo.tags || 'people'}.png`}
                                alt={photo.tags}
                                className="w-10 h-10 absolute -left-9 top-1/2 -translate-y-1/2"
                            />

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
