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

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setSelectedFiles(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  // 일기 생성 핸들러
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

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">📸 일기 작성하기</h2>

      {/* 사진 업로드 */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="mb-4"
      />

      {/* 미리보기 */}
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {previewUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`preview-${idx}`}
              className="w-32 h-32 object-cover rounded border"
            />
          ))}
        </div>
      )}

      {/* 추가 정보 선택 토글 */}
      <div className="flex justify-center mt-10">
        <button
          className="flex items-center gap-2 bg-gray-200 text-black px-4 py-2 rounded shadow"
          onClick={() => setShowOptions(!showOptions)}
        >
          🧾 추가 정보 선택하기
        </button>
      </div>

      {/* 추가 정보 선택 UI */}
      {showOptions && (
        <div className="grid gap-3 mt-6 text-sm">
          {/* 동반자 */}
          <div>
            <label className="block font-semibold mb-1">동반자</label>
            <div className="flex gap-4">
              {["연인", "친구", "부모님", "혼자"].map((opt) => (
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

          {/* 기분 */}
          <div>
            <label className="block font-semibold mb-1">기분</label>
            <div className="flex gap-4">
              {["좋음", "보통", "나쁨"].map((opt) => (
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

          {/* 말투 스타일 */}
          <div>
            <label className="block font-semibold mb-1">말투 스타일</label>
            <div className="flex gap-4">
              {["감성적인", "담백한", "발랄한", "유머러스한"].map((opt) => (
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

          {/* 일기 길이 */}
          <div>
            <label className="block font-semibold mb-1">일기 길이</label>
            <div className="flex gap-4">
              {["짧게", "중간", "길게"].map((opt) => (
                <label key={opt} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="length"
                    value={opt}
                    checked={lengthOption === opt}
                    onChange={(e) => setLengthOption(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* 날씨 */}
          <div>
            <label className="block font-semibold mb-1">날씨</label>
            <div className="flex gap-4">
              {["맑음", "흐림", "비", "눈"].map((opt) => (
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

      {/* 생성 버튼 */}
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
