import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import PhotoModal from '../components/PhotoModal'; // ✅ 모달 컴포넌트
import { FaArrowLeftLong } from "react-icons/fa6";

const tagLabels = {
  people: '인물',
  landscape: '풍경',
  food: '음식',
  accommodation: '숙소'
};

function GalleryFolder() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userData = localStorage.getItem('user');
  const user_id = userData ? JSON.parse(userData).user_id : null;

  useEffect(() => {
    if (!user_id) return;

    axios
      .get(`http://localhost:5000/api/gallery/${tag}?user_id=${user_id}`)
      .then((res) => setPhotos(res.data))
      .catch((err) => console.error('📛 사진 불러오기 실패:', err));
  }, [tag, user_id]);

  return (
    <div className="p-4 max-w-[420px] mx-auto bg-white min-h-screen">
      <div className="relative mb-4">
        <button
          onClick={() => navigate('/gallery')}
          className="absolute top-1 left-1 text-blue-400 text-2xl"
          aria-label="뒤로가기"
        >
          <FaArrowLeftLong />
        </button>

        <h2 className="text-xl font-bold ml-12">{tagLabels[tag]}</h2>
      </div>


      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <img
            key={idx}
            src={`http://localhost:5000/uploads/${photo.file_name}`}
            alt={`img-${idx}`}
            className="w-full h-32 object-cover rounded cursor-pointer"
            onClick={() => {
              console.log(photo);
              setSelectedPhoto(photo);
              setIsModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* ✅ 전체화면 모달 */}
      {isModalOpen && selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPhoto(null);
          }}
        />
      )}
    </div>
  );
}

export default GalleryFolder;
