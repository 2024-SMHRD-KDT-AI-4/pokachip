import React, { useState } from 'react';
import ImageModal from './ImageModal';
import dayjs from 'dayjs';

export default function TimelineItem({ title, photos }) {
    const [showPhotos, setShowPhotos] = useState(false);
    const [modalImage, setModalImage] = useState(null);

    const baseURL =
        import.meta.env.MODE === "development"
            ? import.meta.env.VITE_API_LOCAL
            : import.meta.env.VITE_API_DEPLOY;


    return (
        <div className="mb-20 ml-4">
            {/* ✅ 날짜 & 마커 아이콘 묶어서 클릭 가능하게 */}
            <div className="flex items-center cursor-pointer mb-2 ml-[-8px]" onClick={() => setShowPhotos(!showPhotos)}>
                <img
                    src="/logomarker.png"
                    alt="Logo Marker"
                    className="w-5 h-5 mr-2 object-contain"
                />
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>

            {/* ✅ 사진 리스트 (토글) */}
            {showPhotos && (
                <div className="ml-4 pl-4 flex flex-col gap-6">
                    {photos.map((photo, index) => (
                        <div key={index} className="flex flex-col items-center relative">
                            <img
                                src={`${baseURL}/uploads/${photo.file_name}`}
                                alt="photo"
                                className="w-72 h-48 object-cover rounded shadow cursor-pointer"
                                onClick={() => setModalImage(`${baseURL}/uploads/${photo.file_name}`)}
                            />
                            <div className="text-xs text-gray-500 mt-1 text-center">
                                {dayjs(photo.taken_at).format('YYYY.MM.DD HH:mm')}
                            </div>
                            <div className="text-xs text-gray-700 text-center">
                                {photo.diary_title || ''}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ✅ 이미지 모달 */}
            {modalImage && (
                <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
            )}
        </div>
    );
}
