import React, { useState } from 'react';
import ImageModal from './ImageModal';

export default function TimelineItem({ title, photos }) {
  const [showPhotos, setShowPhotos] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  return (
    <div className="mb-6 ml-4">
      {/* 타이틀 */}
      <div className="flex items-center cursor-pointer mb-2" onClick={() => setShowPhotos(!showPhotos)}>
        <div className="w-4 h-4 rounded-full bg-red-500 mr-2" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      {showPhotos && (
        <div className="ml-4 border-l-2 border-gray-200 pl-4 flex flex-col gap-6">
          {photos.map((photo, index) => (
            <div key={index} className="flex flex-col items-center relative"> {/* relative 추가 */}
              
              {/* ✅ 태그 마커 - 노란색 얇은 줄 위에, 마커 아이콘의 가운데가 오도록 위치 조정 */}
              <img
                src={`/${photo.tags || 'people'}.png`}
                alt={photo.tags}
                className="w-10 h-10 absolute -left-9 top-1/2 -translate-y-1/2" /* left 값을 -12로 다시 수정 */
              />

              {/* ✅ 썸네일 이미지 */}
              <img
                src={`http://localhost:5000/uploads/${photo.file_name}`}
                alt="photo"
                className="w-72 h-48 object-cover rounded shadow cursor-pointer"
                onClick={() => setModalImage(`http://localhost:5000/uploads/${photo.file_name}`)}
              />

              {/* ✅ 시간 정보 */}
              <div className="text-xs text-gray-500 mt-1 text-center">
                {new Date(photo.taken_at).toLocaleTimeString()}
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