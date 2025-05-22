import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import PhotoMap from './pages/PhotoMap';
import MainPage from './pages/MainPage';
import DiaryCreate from './pages/DiaryCreate'; // ✅ 실제 위치에 맞게 수정
import DiaryView from './pages/DiaryView';     // ✅ [추가] 일기 상세 페이지 컴포넌트 import

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; // ✅ [추가] React Router 사용을 위한 import

// ✅ [추가] URL이 /diary/:id 형식이면 DiaryView.jsx를 보여주는 역할
function RoutingWrapper({ children }) {
  const location = useLocation();
  const isDiaryView = /^\/diary\/\d+$/.test(location.pathname); // 경로가 /diary/숫자 형태인지 검사

  return isDiaryView ? <DiaryView /> : children; // 해당하면 DiaryView, 아니면 기존 화면 보여줌
}

function AppContent() {
  const { user } = useAuth(); // ✅ 로그인한 사용자 정보
  const [view, setView] = useState("main");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ✅ user.user_id가 바뀔 때마다 Header도 새로 렌더됨 */}
      <Header key={user?.user_id || "guest"} />

      <main className="flex-1 overflow-y-auto">
        {/* ✅ [추가] DiaryView 라우트 감지용 래퍼로 기존 뷰를 감쌈 */}
        <RoutingWrapper>
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
        </RoutingWrapper>
      </main>

      <FooterNav setView={setView} />
    </div>
  );
}

// ✅ [추가] React Router로 AppContent를 감싸기 위한 최상위 구성
function App() {
  return <AppContent />;
}

export default App;
