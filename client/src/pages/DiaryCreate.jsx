import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function DiaryCreate() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [companion, setCompanion] = useState('');
  const [feeling, setFeeling] = useState('');
  const [length, setLength] = useState('중간');
  const [tone, setTone] = useState('감성적인');
  const [weather, setWeather] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const userData = localStorage.getItem('user');
  let userEmail = null;
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      userEmail = parsed.user_id;
    } catch (e) {
      console.error('❌ 로그인 정보 파싱 실패:', e);
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setSelectedFiles(files);
    setPreviewUrls(files.map(file => URL.createObjectURL(file)));
  };

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) return alert('사진을 업로드해주세요.');
    if (!userEmail) return alert('로그인 정보가 없습니다.');

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('photos', file));
    formData.append('user_id', userEmail);
    formData.append('companion', companion);
    formData.append('feeling', feeling);
    formData.append('length', length);
    formData.append('tone', tone);
    formData.append('weather', weather);

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/diary/image-generate',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const createdDiaryId = res.data.diary_idx;
      if (!createdDiaryId) return alert("일기 ID를 받아오지 못했습니다.");
      navigate(`/diary/${createdDiaryId}`);
    } catch (err) {
      console.error('일기 생성 실패:', err);
      alert('GPT 호출 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const SelectionGroup = ({ title, options, selected, onSelect }) => (
    <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
      <h4 className="font-semibold mb-4 text-gray-700 text-center">{title}</h4>
      <div className="grid grid-cols-4 gap-3 justify-items-center">
        {options.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className={`w-20 h-20 flex flex-col items-center justify-center rounded-xl shadow-sm border transition text-sm
              ${selected === label ? 'bg-blue-100 border-blue-400 font-semibold' : 'bg-white border-gray-200'}`}
          >
            <div className="text-xl mb-1">{icon}</div>
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 px-4 py-8 pt-28 max-w-[420px] mx-auto">

      {/* 🔝 상단 고정 영역: 뒤로가기 + 로고 */}
      <div className="fixed top-0 left-0 w-full bg-white z-50">
        <div className="max-w-[420px] mx-auto flex items-center px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="text-blue-400 text-2xl font-bold"
          >
            ←
          </button>

          <div className="flex-grow flex justify-center">
            <img
              src="/logo.png"
              alt="Site Logo"
              className="h-16 object-contain cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
        </div>
      </div>

      {/* 📤 사진 업로드 */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <label className="block text-sm font-semibold mb-2">📸 사진 업로드 (최대 5장)</label>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
          {previewUrls.length < 5 && (
            <label htmlFor="photo-upload" className="flex-none w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-3xl cursor-pointer hover:border-blue-400 transition">
              +
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
          {previewUrls.map((url, idx) => (
            <div key={idx} className="flex-none w-24 h-24 rounded-lg overflow-hidden border">
              <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* 🧾 추가 정보 토글 */}
      <div className="text-center mb-4">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-blue-600 font-semibold underline"
        >
          🧾 추가 정보 선택하기
        </button>
      </div>

      {/* 추가 선택 옵션 */}
      {showOptions && (
        <div className="space-y-4 mb-8">
          <SelectionGroup
            title="누구와 함께 갔나요?"
            selected={companion}
            onSelect={setCompanion}
            options={[
              { label: '연인', icon: '❤️‍🔥' },
              { label: '친구', icon: '👫' },
              { label: '부모님', icon: '👨‍👩‍👧' },
              { label: '혼자', icon: '🧍' }
            ]}
          />
          <SelectionGroup
            title="그 날은 어떤 기분이었나요?"
            selected={feeling}
            onSelect={setFeeling}
            options={[
              { label: '좋음', icon: '😄' },
              { label: '보통', icon: '😐' },
              { label: '나쁨', icon: '😢' }
            ]}
          />
          <SelectionGroup
            title="말투"
            selected={tone}
            onSelect={setTone}
            options={[
              { label: '감성적인', icon: '💌' },
              { label: '담백한', icon: '📘' },
              { label: '발랄한', icon: '🎈' },
              { label: '유머러스한', icon: '😆' }
            ]}
          />
          <SelectionGroup
            title="길이"
            selected={length}
            onSelect={setLength}
            options={[
              { label: '짧게', icon: '✏️' },
              { label: '중간', icon: '📝' },
              { label: '길게', icon: '📖' }
            ]}
          />
          <SelectionGroup
            title="날씨"
            selected={weather}
            onSelect={setWeather}
            options={[
              { label: '맑음', icon: '☀️' },
              { label: '흐림', icon: '☁️' },
              { label: '비', icon: '🌧️' },
              { label: '눈', icon: '❄️' }
            ]}
          />
        </div>
      )}

      {/* ✨ 생성 버튼 */}
      <div className="w-full mt-8">
        <button
          onClick={handleGenerate}
          className="w-full py-3 bg-blue-500 text-white font-bold rounded-full shadow-lg text-lg hover:bg-blue-600 transition"
        >
          ✨ 일기 생성하기
        </button>
      </div>

      {/* 로딩 모달 */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
            <img
              src="/logo.png"
              alt="Loading..."
              className="w-16 h-16 mb-4 animate-logo-bounce"
            />
            <p className="text-gray-700 text-lg font-semibold">일기를 생성 중입니다...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiaryCreate;
