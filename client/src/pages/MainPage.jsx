import Header from "../components/Header";
import FooterNav from "../components/FooterNav";
import PhotoMap from "./PhotoMap"; // ✅ PhotoMap 불러오기

function MainPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 space-y-8">
        {/* 최근 여행 일기 */}
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

        {/* 여행 지도 (PhotoMap 직접 삽입) */}
        <section>
          <h2 className="text-lg font-semibold mb-4">여행 지도</h2>
          <PhotoMap /> {/* ✅ 지도 업로드 기능 바로 출력 */}
        </section>
      </main>

      <FooterNav />
    </div>
  );
}

export default MainPage;
