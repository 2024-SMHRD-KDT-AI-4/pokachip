// client/src/pages/DiaryCreate.jsx

import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function DiaryCreate() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [companion, setCompanion] = useState("");
  const [feeling, setFeeling] = useState("");
  const [lengthOption, setLengthOption] = useState("중간");
  const [tone, setTone] = useState("감성적인");
  const [weather, setWeather] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setSelectedFiles(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  const handleGenerate = async () => {
    const token = localStorage.getItem("token");
    if (selectedFiles.length === 0) {
      toast.warn("사진을 업로드해주세요.");
      return;
    }
    if (!token) {
      toast.info("로그인이 필요합니다.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("photos", file));
    formData.append("companion", companion);
    formData.append("feeling", feeling);
    formData.append("length", lengthOption);
    formData.append("tone", tone);
    formData.append("weather", weather);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/diary/image-generate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const createdDiaryId = res.data.diary_idx;
      if (!createdDiaryId) {
        toast.error("일기 ID를 받아오지 못했습니다.");
        return;
      }
      navigate(`/diary/${createdDiaryId}`);
    } catch (err) {
      console.error("일기 생성 실패:", err);
      toast.error("GPT 호출 실패");
    }
  };

  const OptionButton = ({ label, selected, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap
        ${selected ? 'bg-blue-500 text-white font-semibold' : 'bg-white text-gray-800'} 
        shadow hover:shadow-md transition`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 px-4 py-8 max-w-[420px] mx-auto relative transition-all duration-300 ease-in-out">
      <h2 className="text-2xl font-bold text-center mb-8">📖 감성 일기 만들기</h2>

      {/* 사진 업로드 */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <label className="block text-sm font-semibold mb-2">📸 사진 업로드 (최대 5장)</label>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
          {previewUrls.length < 5 && (
            <label
              htmlFor="photo-upload"
              className="flex-none w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-3xl cursor-pointer hover:border-blue-400 transition"
            >
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

      {/* 추가 정보 토글 */}
      <div className="text-center mb-4">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-blue-600 font-semibold underline"
        >
          🧾 추가 정보 선택하기
        </button>
      </div>

      {/* 추가 정보 입력 */}
      {showOptions && (
        <div className="bg-white rounded-xl shadow-md p-5 space-y-6 text-sm mb-6">
          {[
            { title: '👥 동반자', values: ['연인', '친구', '부모님', '혼자'], state: companion, setter: setCompanion },
            { title: '😊 기분', values: ['좋음', '보통', '나쁨'], state: feeling, setter: setFeeling },
            { title: '🗣️ 말투', values: ['감성적인', '담백한', '발랄한', '유머러스한'], state: tone, setter: setTone },
            { title: '📏 길이', values: ['짧게', '중간', '길게'], state: lengthOption, setter: setLengthOption },
            { title: '🌤️ 날씨', values: ['맑음', '흐림', '비', '눈'], state: weather, setter: setWeather },
          ].map(({ title, values, state, setter }) => (
            <div key={title}>
              <label className="block font-semibold mb-1">{title}</label>
              <div className="flex flex-wrap gap-2">
                {values.map(opt => (
                  <OptionButton
                    key={opt}
                    label={opt}
                    selected={state === opt}
                    onClick={() => setter(opt)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 생성 버튼 */}
      <div className="w-full mt-8">
        <button
          onClick={handleGenerate}
          className="w-full py-3 bg-blue-500 text-white font-bold rounded-full shadow-lg text-lg hover:bg-blue-600 transition"
        >
          ✨ 일기 생성하기
        </button>
      </div>
    </div>
  );
}

export default DiaryCreate;
