import React from 'react';

export default function ImageModal({ imageUrl, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white p-3 rounded-xl">
        <img src={imageUrl} alt="modal" className="max-w-sm max-h-[80vh]" />
        <button onClick={onClose} className="mt-3 block mx-auto bg-red-500 text-white px-4 py-2 rounded">
          닫기
        </button>
      </div>
    </div>
  );
}
