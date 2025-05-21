import { useState } from "react";
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import MainPage from './pages/MainPage';
import PhotoMap from './pages/PhotoMap';
import DiaryCreate from "./components/DiaryCreate";

function App() {
  const [view, setView] = useState("main");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
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
