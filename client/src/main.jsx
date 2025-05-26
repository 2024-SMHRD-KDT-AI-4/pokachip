import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DiaryCreate from './pages/DiaryCreate';
import PhotoMap from './pages/PhotoMap';
import DiaryView from './pages/DiaryView';
import { AuthProvider } from './context/AuthContext';
import GalleryHome from './pages/GalleryHome';
import GalleryFolder from './pages/GalleryFolder';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/diarycreate" element={<DiaryCreate />} />
          <Route path="/map" element={<PhotoMap />} />
          <Route path="/diary/:id" element={<DiaryView />} />
          <Route path="/gallery" element={<GalleryHome />} />
          <Route path="/gallery/:tag" element={<GalleryFolder />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
