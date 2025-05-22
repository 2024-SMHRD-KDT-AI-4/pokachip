import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DiaryCreate from './pages/DiaryCreate';
import PhotoMap from './pages/PhotoMap'; // /map에 대응할 페이지
import DiaryView from './pages/DiaryView';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/diarycreate" element={<DiaryCreate />} /> {/* ✅ 추가 */}
          <Route path="/map" element={<PhotoMap />} />             {/* ✅ 추가 */}
          <Route path="/diary/:id" element={<DiaryView />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
