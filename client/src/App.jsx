import Header from './components/Header';
import FooterNav from './components/FooterNav';
import MainContent from './components/MainContent';

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <MainContent />
      </main>
      <FooterNav />
    </div>
  );
}

export default App;