import { useEffect, useState } from "react";
import FooterNav from "../components/FooterNav";
import PhotoMapForMain from "./PhotoMapForMain";

function MainPage() {
  const [photos, setPhotos] = useState([]);
  const [diary, setDiary] = useState(null); // ✅ 일기 추가

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // 1) 사진 불러오기
    fetch("http://localhost:5000/userPhotos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPhotos(data);

        // 2) 사진이 있으면 → 첫 번째 photoIdx로 연결된 diary 불러오기
        if (data.length > 0) {
          const firstPhotoIdx = data[0].photoIdx;

          fetch(`http://localhost:5000/api/diary/photo/${firstPhotoIdx}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => {
              if (!res.ok) {
                console.warn("해당 사진의 일기가 없습니다.");
                return null;
              }
              return res.json();
            })
            .then((d) => {
              if (d) setDiary(d);
            })
            .catch((err) => {
              console.error("일기 불러오기 실패:", err);
            });
        }
      })
      .catch((err) => console.error("사진 로딩 실패:", err));
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto p-4 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">최근 여행 일기</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="w-32 flex-shrink-0 bg-gray-100 rounded shadow p-2 text-center"
              >
                <div className="w-full h-24 bg-gray-300 mb-2" />
                <p className="text-sm text-gray-700">일기 제목</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">여행 지도</h2>
          <PhotoMapForMain photos={photos} diary={diary} />
        </section>
      </main>

      <FooterNav />
    </div>
  );
}

export default MainPage;
