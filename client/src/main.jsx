import React from 'react';
import ReactDOM from 'react-dom/client';
import MainPage from './pages/MainPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage';
import DiaryCreate from './pages/DiaryCreate.jsx';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/diarycreate" element={<DiaryCreate/>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
