import React, { useState } from 'react';
import ImageModal from './ImageModal';

export default function TimelineItem({ title, photos }) {
  const [showPhotos, setShowPhotos] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  return (
    <div className="mb-6">
      <div className="flex items-center cursor-pointer" onClick={() => setShowPhotos(!showPhotos)}>
        <div className="w-4 h-4 rounded-full bg-blue-500 mr-2" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      {showPhotos && (
        <div className="ml-2 mt-2 border-l-2 border-gray-300 pl-4">
          {photos.map((photo, index) => (
            <div key={index} className="flex items-center gap-3 mb-3">
              <div className="text-sm text-gray-500 whitespace-nowrap">
                {new Date(photo.taken_at).toLocaleString()}
              </div>
              <img
                src={`http://localhost:5000/uploads/${photo.file_name}`}  // 🔄 실제 경로로 수정
                alt="photo"
                className="w-24 h-16 object-cover rounded cursor-pointer"
                onClick={() => setModalImage(`http://localhost:5000/uploads/${photo.file_name}`)}
              />
            </div>
          ))}
        </div>
      )}

      {modalImage && (
        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      )}
    </div>
  );
}
