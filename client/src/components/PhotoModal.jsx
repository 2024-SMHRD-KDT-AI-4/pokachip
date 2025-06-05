import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import DiarySlidePanel from './DiarySlidePanel';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import FolderSelectModal from './FolderSelectModal';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';

const tagLabels = {
  people: '인물',
  landscape: '풍경',
  food: '음식',
  accommodation: '숙소',
};

function PhotoModal({ photo, onClose }) {
  const [diary, setDiary] = useState(null);
  const [showUI, setShowUI] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300); // default fallback

  const panelRef = useRef(null);
  const { tag } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!photo?.photo_idx) return;

    axios
      .get(`http://localhost:5000/api/diary/photo/${photo.photo_idx}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((res) => setDiary(res.data))
      .catch((err) => {
        console.error('❌ 일기 불러오기 실패:', err);
        setDiary(null);
      });
  }, [photo]);

  useEffect(() => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setPanelHeight(rect.height);
    }
  }, [diary]);

  const handleFolderMove = async (newTag) => {
    try {
      await axios.put(`http://localhost:5000/api/gallery/${photo.photo_idx}/move`, {
        newTag,
      });
      onClose();
      navigate(`/gallery/${newTag}`);
    } catch (err) {
      console.error('❌ 폴더 이동 실패:', err);
      alert('폴더 이동에 실패했습니다.');
    }
  };

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-start"
      onClick={() => setShowUI(!showUI)}
    >
      {showUI && (
        <div className="w-full flex justify-between items-center px-4 py-3 text-white absolute top-0 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <FaArrowLeftLong size={24} />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
            >
              <HiOutlineDotsVertical size={22} />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-36 bg-white text-black text-sm rounded shadow z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setShowFolderSelect(true);
                    setShowMenu(false);
                  }}
                >
                  폴더 변경
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center">
        <img
          src={`http://localhost:5000/uploads/${photo.file_name}`}
          alt="fullscreen"
          className="max-w-full max-h-full object-contain"
        />
      </div>

      <DiarySlidePanel
        diary={diary}
        showHandle={showUI}
        panelRef={panelRef}
        panelHeight={panelHeight}
      />

      {showFolderSelect && (
        <FolderSelectModal
          currentTag={tag}
          onClose={() => setShowFolderSelect(false)}
          onSelect={(newTag) => {
            setShowFolderSelect(false);
            handleFolderMove(newTag);
          }}
        />
      )}
    </div>
  );
}

export default PhotoModal;
