import { useNavigate, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ showBack = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHome = location.pathname === '/';

  return (
    <nav className="navbar">
      {showBack && !isHome ? (
        <button className="navbar-back" onClick={() => navigate('/')}>
          ←
        </button>
      ) : (
        <a href="/" className="navbar-brand" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <span className="navbar-logo">🔮</span>
          <span className="navbar-title">TaroTaro</span>
        </a>
      )}
      
      <LanguageSelector />
    </nav>
  );
};

export default Navbar;
