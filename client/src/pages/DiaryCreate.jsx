import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function DiaryCreate() {
  const navigate = useNavigate();

  const userData = localStorage.getItem('user');
  let userEmail = null;
  try {
    userEmail = JSON.parse(userData)?.user_id || null;
  } catch (e) {
    toast.error('❌ 로그인 정보 파싱 실패');
  }

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [companion, setCompanion] = useState('');
  const [feeling, setFeeling] = useState('');
  const [length, setLength] = useState('중간');
  const [tone, setTone] = useState('감성적인');
  const [weather, setWeather] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setSelectedFiles(files);
    setPreviewUrls(files.map(file => URL.createObjectURL(file)));
  };

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) return toast.warn('📷 사진을 업로드해주세요!');
    if (!userEmail) return toast.error('⚠️ 로그인 정보가 없습니다.');

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('photos', file));
    formData.append('user_id', userEmail);
    formData.append('companion', companion);
    formData.append('feeling', feeling);
    formData.append('length', length);
    formData.append('tone', tone);
    formData.append('weather', weather);

    try {
      const res = await axios.post('http://localhost:5000/api/diary/image-generate', formData);
      const diaryId = res.data.diary_idx;
      if (!diaryId) return toast.error('❗ 일기 ID를 받아오지 못했습니다');
      toast.success('🎉 일기 생성 성공!');
      navigate(`/diary/${diaryId}`);
    } catch (err) {
      console.error(err);
      toast.error('🚫 GPT 호출 실패');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />

      <h2 className="text-xl font-bold mb-4 text-center">📸 일기 작성하기</h2>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="mb-4"
      />

      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {previewUrls.map((url, idx) => (
            <img key={idx} src={url} alt={`preview-${idx}`} className="w-32 h-32 object-cover rounded border" />
          ))}
        </div>
      )}

      <div className="flex justify-center mt-10">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="bg-gray-200 text-black px-4 py-2 rounded shadow"
        >
          🧾 추가 정보 선택하기
        </button>
      </div>

      {showOptions && (
        <div className="grid gap-3 mt-6 text-sm">
          {renderOptionGroup("동반자", companion, setCompanion, ['연인', '친구', '부모님', '혼자'], "companion")}
          {renderOptionGroup("기분", feeling, setFeeling, ['좋음', '보통', '나쁨'], "feeling")}
          {renderOptionGroup("말투 스타일", tone, setTone, ['감성적인', '담백한', '발랄한', '유머러스한'], "tone")}
          {renderOptionGroup("일기 길이", length, setLength, ['짧게', '중간', '길게'], "length")}
          {renderOptionGroup("날씨", weather, setWeather, ['맑음', '흐림', '비', '눈'], "weather")}
        </div>
      )}

      <div className="flex justify-center mt-10">
        <button
          onClick={handleGenerate}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
        >
          일기 생성하기
        </button>
      </div>
    </div>
  );
}

// ✅ 옵션 렌더링 함수 (컴포넌트 외부에서 선언)
function renderOptionGroup(label, state, setState, options, name) {
  return (
    <div>
      <label className="block font-semibold mb-1">{label}</label>
      <div className="flex gap-4">
        {options.map(opt => (
          <label key={opt} className="inline-flex items-center gap-1">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={state === opt}
              onChange={e => setState(e.target.value)}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

export default DiaryCreate;
