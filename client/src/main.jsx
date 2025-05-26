import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DiaryCreate from './pages/DiaryCreate';
import DiaryView from './pages/DiaryView';
import GalleryHome from './pages/GalleryHome';
import GalleryFolder from './pages/GalleryFolder';
import MapPage from './pages/MapPage';
import { AuthProvider } from './context/AuthContext';
import MyPage from './pages/MyPage';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/diarycreate" element={<DiaryCreate />} />
          <Route path="/diary/:id" element={<DiaryView />} />
          <Route path="/gallery" element={<GalleryHome />} />
          <Route path="/gallery/:tag" element={<GalleryFolder />} />
          <Route path="/mypage" element={<MyPage />} /> 
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
