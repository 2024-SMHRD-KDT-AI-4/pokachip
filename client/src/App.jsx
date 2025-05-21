import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import PhotoMap from './pages/PhotoMap';
import MainPage from './pages/MainPage';
import DiaryCreate from './pages/DiaryCreate'; // ✅ 실제 위치에 맞게 수정

import { useState } from 'react';

function App() {
  const { user } = useAuth(); // ✅ 로그인한 사용자 정보
  const [view, setView] = useState("main");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ✅ user.user_id가 바뀔 때마다 Header도 새로 렌더됨 */}
      <Header key={user?.user_id || "guest"} />

      <main className="flex-1 overflow-y-auto">
        {view === "main" ? (
          <MainPage setView={setView} />
        ) : view === "create" ? (
          <DiaryCreate setView={setView} />
        ) : (
          <div>
            <button
              onClick={() => setView("main")}
              className="bg-gray-500 text-white px-4 py-2 rounded m-4"
            >
              메인으로 돌아가기
            </button>
            <PhotoMap />
          </div>
        )}
      </main>

      <FooterNav setView={setView} />
    </div>
  );
}

export default App;
