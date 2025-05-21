import { useNavigate } from 'react-router-dom';

function FooterNav() {
  const navigate = useNavigate();

  return (
    <nav className="bg-blue-100 p-2 flex justify-around items-center fixed bottom-0 w-full z-50">
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => navigate('/diarycreate')}
      >
        📋
      </button>
      <button
        className="text-gray-600 hover:text-black"
        onClick={() => navigate('/map')}
      >
        🖼️
      </button>
      <button className="text-gray-600 hover:text-black">👤</button>
      <button className="text-gray-600 hover:text-black">⚙️</button>
    </nav>
  );
}

export default FooterNav;
