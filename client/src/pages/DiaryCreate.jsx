// ✅ DiaryCreate.jsx - 감성 일기 생성 화면 (사진 업로드, GPT 기반 생성, DB 저장, 상세 페이지로 이동)

import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ✅ 일기 작성 화면 컴포넌트 시작
function DiaryCreate() {
  const navigate = useNavigate(); // ← 일기 생성 후 상세 페이지로 이동하기 위해 사용
  const [selectedFiles, setSelectedFiles] = useState([]);         // 업로드된 파일 목록
  const [previewUrls, setPreviewUrls] = useState([]);             // 업로드된 사진 미리보기 URL
  const [companion, setCompanion] = useState('');                 // 동반자
  const [feeling, setFeeling] = useState('');                     // 기분
  const [length, setLength] = useState('중간');                   // 글 길이
  const [tone, setTone] = useState('감성적인');                   // 말투
  const [weather, setWeather] = useState('');                     // 날씨
  const [showOptions, setShowOptions] = useState(false);          // 추가 옵션 보여줄지 여부

  // ✅ 로그인된 사용자 정보 가져오기 (localStorage에서 user_id 읽기)
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

  // ✅ 파일 선택 시 상태에 저장 + 미리보기 URL 생성
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // 최대 5개까지만 허용
    setSelectedFiles(files);
    setPreviewUrls(files.map(file => URL.createObjectURL(file))); // 미리보기용 URL 생성
  };

  // ✅ "일기 생성하기" 버튼 클릭 시 실행되는 함수
  const handleGenerate = async () => {
    // 필수 입력 체크
    if (selectedFiles.length === 0) return alert('사진을 업로드해주세요.');
    if (!userEmail) return alert('로그인 정보가 없습니다.');

    // formData 객체에 업로드 파일 + 선택 정보 담기
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });
    formData.append('user_id', userEmail);
    formData.append('companion', companion);
    formData.append('feeling', feeling);
    formData.append('length', length);
    formData.append('tone', tone);
    formData.append('weather', weather);

    // ✅ 서버에 GPT 일기 생성 요청
    try {
      const res = await axios.post('http://localhost:5000/api/diary/image-generate', formData);
      const createdDiaryId = res.data.diary_idx; // 응답에서 생성된 일기 ID 가져오기

      if (!createdDiaryId) {
        alert("일기 ID를 받아오지 못했습니다.");
        return;
      }

      navigate(`/diary/${createdDiaryId}`); // ✅ 일기 상세 페이지로 이동
    } catch (err) {
      console.error('일기 생성 실패:', err);
      alert('GPT 호출 실패');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">📸 일기 작성하기</h2>

      {/* ✅ 사진 파일 업로드 */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="mb-4"
      />

      {/* ✅ 사진 미리보기 */}
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {previewUrls.map((url, idx) => (
            <img key={idx} src={url} alt={`preview-${idx}`} className="w-32 h-32 object-cover rounded border" />
          ))}
        </div>
      )}

      {/* ✅ 추가 옵션 열기 버튼 */}
      <div className="flex justify-center mt-10">
        <button
          className="flex items-center gap-2 bg-gray-200 text-black px-4 py-2 rounded shadow"
          onClick={() => setShowOptions(!showOptions)}
        >
          🧾 추가 정보 선택하기
        </button>
      </div>

      {/* ✅ 동반자, 기분, 말투, 길이, 날씨 선택 영역 */}
      {showOptions && (
        <div className="grid gap-3 mt-6 text-sm">
          <div>
            <label className="block font-semibold mb-1">동반자</label>
            <div className="flex gap-4">
              {['연인', '친구', '부모님', '혼자'].map(opt => (
                <label key={opt} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="companion"
                    value={opt}
                    checked={companion === opt}
                    onChange={(e) => setCompanion(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">기분</label>
            <div className="flex gap-4">
              {['좋음', '보통', '나쁨'].map(opt => (
                <label key={opt} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="feeling"
                    value={opt}
                    checked={feeling === opt}
                    onChange={(e) => setFeeling(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">말투 스타일</label>
            <div className="flex gap-4">
              {['감성적인', '담백한', '발랄한', '유머러스한'].map(opt => (
                <label key={opt} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="tone"
                    value={opt}
                    checked={tone === opt}
                    onChange={(e) => setTone(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">일기 길이</label>
            <div className="flex gap-4">
              {['짧게', '중간', '길게'].map(opt => (
                <label key={opt} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="length"
                    value={opt}
                    checked={length === opt}
                    onChange={(e) => setLength(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">날씨</label>
            <div className="flex gap-4">
              {['맑음', '흐림', '비', '눈'].map(opt => (
                <label key={opt} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="weather"
                    value={opt}
                    checked={weather === opt}
                    onChange={(e) => setWeather(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✅ 생성 버튼 */}
      <div className="flex justify-center mt-10">
        <button
          onClick={handleGenerate}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
        >
          📤 일기 생성하기
        </button>
      </div>
    </div>
  );
}

export default DiaryCreate;
