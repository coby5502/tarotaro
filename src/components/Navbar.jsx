import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ title, showBack = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  
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
      
      {title && <span className="navbar-center">{title}</span>}
      
      <LanguageSelector />
    </nav>
  );
};

export default Navbar;

