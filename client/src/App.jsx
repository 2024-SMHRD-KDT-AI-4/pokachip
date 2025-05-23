import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import PhotoMap from './pages/PhotoMap';
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
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
