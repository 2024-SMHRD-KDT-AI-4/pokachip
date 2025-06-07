import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DiaryCreate from './pages/DiaryCreate';
import DiaryView from './pages/DiaryView';
import GalleryHome from './pages/GalleryHome';
import GalleryFolder from './pages/GalleryFolder';
import MapPage from './pages/MapPage';
import { AuthProvider } from './context/AuthContext';
import MyPage from './pages/MyPage';
import DiaryListPage from './pages/DiaryListPage';

// ✅ 서비스워커 등록 (PWA 기능)
registerSW({
  onNeedRefresh() {
    console.log('새로운 업데이트가 있습니다. 새로고침 해주세요.');
  },
  onOfflineReady() {
    console.log('오프라인에서도 사용 가능합니다!');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/diarycreate" element={<DiaryCreate />} />
            <Route path="/diary/:id" element={<DiaryView />} />
            <Route path="/gallery" element={<GalleryHome />} />
            <Route path="/gallery/:tag" element={<GalleryFolder />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/diarylist" element={<DiaryListPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
