// ✅ 1. 다이어리 작성 화면 (일기 생성)
// DiaryCreate.jsx

import { useState } from 'react';
import axios from 'axios';

export default function DiaryCreate() {
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [info, setInfo] = useState({
    companion: '',
    feeling: '',
    tone: '',
    length: '',
    weather: ''
  });
  const [diary, setDiary] = useState('');
  const [viewMode, setViewMode] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setPhotos(files);
    setPreview(files.map(f => URL.createObjectURL(f)));
  };

  const handleCheck = (key, value) => {
    setInfo(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  };

  const handleGenerate = async () => {
    const form = new FormData();
    photos.forEach(photo => form.append('photos', photo));
    Object.entries(info).forEach(([k, v]) => form.append(k, v));

    const res = await axios.post('http://localhost:5000/api/diary/image-generate', form);
    setDiary(res.data.diary);
    setViewMode(true);
  };

  const tags = {
    companion: ['연인', '친구', '부모님', '혼자'],
    feeling: ['좋음', '보통', '나쁨'],
    tone: ['감성적인', '담백한', '발랄한', '유머러스한'],
    length: ['짧게', '중간', '길게'],
    weather: ['맑음', '흐림', '비', '눈']
  };

  const next = () => setSlideIdx((slideIdx + 1) % preview.length);
  const prev = () => setSlideIdx((slideIdx - 1 + preview.length) % preview.length);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {!viewMode ? (
        <>
          <h2 className="text-xl font-bold mb-4">📸 일기 작성하기</h2>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} />

          <div className="flex gap-2 mt-4">
            {preview.map((src, idx) => (
              <img key={idx} src={src} className="w-24 h-24 rounded object-cover" />
            ))}
          </div>

          <button onClick={() => setShowOptions(!showOptions)} className="mt-4 px-4 py-2 bg-gray-200 rounded">
            🎛️ 추가 정보 선택하기
          </button>

          {showOptions && (
            <div className="grid gap-4 mt-4">
              {Object.entries(tags).map(([key, values]) => (
                <div key={key}>
                  <div className="font-semibold mb-1">{key}</div>
                  <div className="flex gap-2 flex-wrap">
                    {values.map(v => (
                      <button
                        key={v}
                        onClick={() => handleCheck(key, v)}
                        className={`px-3 py-1 border rounded-full ${info[key] === v ? 'bg-blue-500 text-white' : 'bg-white'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded shadow"
          >
            📤 일기 생성하기
          </button>
        </>
      ) : (
        <div className="text-center">
          <div className="relative">
            <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2">◀</button>
            <img src={preview[slideIdx]} className="w-full h-96 object-cover rounded" />
            <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2">▶</button>
          </div>
          <div className="mt-6 bg-gray-100 p-4 rounded text-left whitespace-pre-wrap">
            <h3 className="font-semibold mb-2">📖 생성된 감성 일기</h3>
            {diary}
          </div>
        </div>
      )}
    </div>
  );
}
