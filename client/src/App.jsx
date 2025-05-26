import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import MainPage from './pages/MainPage';
import DiaryCreate from './pages/DiaryCreate';
import DiaryView from './pages/DiaryView';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useState } from 'react';
import { useLocation } from 'react-router-dom';

function RoutingWrapper({ children }) {
  const location = useLocation();
  const isDiaryView = /^\/diary\/\d+$/.test(location.pathname);
  return isDiaryView ? <DiaryView /> : children;
}

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState("main");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header key={user?.user_id || "guest"} />
      <main className="flex-1 overflow-y-auto">
        <RoutingWrapper>
          {view === "main" ? (
            <MainPage setView={setView} />
          ) : view === "create" ? (
            <DiaryCreate setView={setView} />
          ) : view === "map" ? (
            <div /> // ✅ 완전히 비어 있는 영역 (추후 지도 컴포넌트 연결 예정)
          ) : (
            <div className="text-center text-gray-400 py-10">존재하지 않는 화면입니다.</div>
          )}
        </RoutingWrapper>
      </main>
      <FooterNav setView={setView} />
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
