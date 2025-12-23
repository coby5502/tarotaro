import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import '../styles/Home.css';

const Home = () => {
  const { t } = useLanguage();

  const spreadList = [
    { 
      key: 'oneCard', 
      icon: '🎴', 
      name: t('oneCard'),
      description: t('oneCardDesc'),
      cardCount: 1
    },
    { 
      key: 'threeCard', 
      icon: '🃏', 
      name: t('threeCard'),
      description: t('threeCardDesc'),
      cardCount: 3
    },
    { 
      key: 'celticCross', 
      icon: '✝️', 
      name: t('celticCross'),
      description: t('celticCrossDesc'),
      cardCount: 10,
      featured: true
    },
  ];

  return (
    <div className="home">
      <div className="stars"></div>
      <div className="twinkling"></div>
      
      {/* 언어 선택기 */}
      <div className="language-wrapper">
        <LanguageSelector />
      </div>
      
      <main className="home-main">
        <motion.header 
          className="home-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            🔮
          </motion.div>
          
          <h1 className="title">{t('appName')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </motion.header>
        
        <motion.section 
          className="spread-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2 className="section-title">{t('selectSpread')}</h2>
          
          <div className="spread-grid">
            {spreadList.map((spread, index) => (
              <Link 
                key={spread.key}
                to={`/reading/${spread.key}`} 
                className={`spread-card ${spread.featured ? 'featured' : ''}`}
              >
                <motion.div 
                  className="spread-card-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="spread-icon">{spread.icon}</span>
                  <h3 className="spread-name">{spread.name}</h3>
                  <span className="spread-count">{spread.cardCount}{t('cards')}</span>
                  <p className="spread-desc">{spread.description}</p>
                  {spread.featured && (
                    <span className="featured-badge">{t('deepAnalysis')}</span>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.section>
      </main>
      
      <footer className="home-footer">
        <p>✨ {t('footerMessage')} ✨</p>
      </footer>
    </div>
  );
};

export default Home;
