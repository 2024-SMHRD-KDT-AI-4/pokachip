
// react-router-dom에서 현재 경로 확인용 useLocation, 하위 컴포넌트 렌더링용 Outlet 가져옴
import { Outlet, useLocation } from 'react-router-dom';
// 상단 헤더 컴포넌트 가져옴
import Header from './components/Header';
// 하단 내비게이션 컴포넌트 가져옴
import FooterNav from './components/FooterNav';
// 알림 메시지 컴포넌트 가져옴 (예: 로그인 필요 안내 등)
import { ToastContainer } from 'react-toastify';
// ToastContainer 기본 스타일 import
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // 현재 URL 경로 가져오기
  const location = useLocation();

  // ✅ 헤더/푸터가 필요한 경로 목록 정의
  const withLayoutRoutes = ["/", "/main", "/map", "/mypage", "/gallery", "/diarylist"];
  // 현재 경로가 위 목록에 포함되어 있는지 확인
  const isWithLayout = withLayoutRoutes.includes(location.pathname);

  return (
    // 배경 이미지가 깔린 전체 화면 레이아웃 설정
    <div
      className="relative w-screen h-screen bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      {/* 가운데 정렬된 흰색 반투명 박스, 너비는 모바일 기준 (420px) */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-[420px] z-10 flex flex-col rounded-xl">
        {/* 내부 내용: 반투명 흰 배경, 위아래 고정 영역(Header/Footer), 중앙 스크롤 가능 */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm shadow-xl flex flex-col overflow-hidden">
          {/* 조건에 따라 헤더 컴포넌트 렌더링 */}
          {isWithLayout && <Header />}

          {/* 메인 컨텐츠 영역, 자식 라우트가 여기에 표시됨 */}
          <main className="flex-1 overflow-y-auto scrollbar-hide">
            <Outlet />
          </main>

          {/* 조건에 따라 하단 네비게이션 컴포넌트 렌더링 */}
          {isWithLayout && <FooterNav />}
        </div>

        {/* 조건에 따라 토스트 메시지 표시용 컴포넌트 렌더링 */}
        {isWithLayout && (
          <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
        )}
      </div>
    </div>
  );
}

export default App;
