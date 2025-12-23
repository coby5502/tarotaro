import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import '../styles/Home.css';

const Home = () => {
  const { t } = useLanguage();

  const spreads = [
    { 
      key: 'oneCard', 
      name: t('oneCard'),
      desc: t('oneCardDesc'),
      count: 1
    },
    { 
      key: 'threeCard', 
      name: t('threeCard'),
      desc: t('threeCardDesc'),
      count: 3
    },
    { 
      key: 'celticCross', 
      name: t('celticCross'),
      desc: t('celticCrossDesc'),
      count: 10
    },
  ];

  return (
    <div className="home">
      <div className="stars"></div>
      <Navbar />
      
      <main className="home-content">
        <motion.div 
          className="home-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-icon">🔮</div>
          <h1 className="hero-title">{t('appName')}</h1>
          <p className="hero-subtitle">{t('subtitle')}</p>
        </motion.div>
        
        <motion.div 
          className="spread-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {spreads.map((spread, index) => (
            <motion.div
              key={spread.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Link to={`/reading/${spread.key}`} className="spread-card">
                <div className="spread-info">
                  <h3>{spread.name}</h3>
                  <p>{spread.desc}</p>
                </div>
                <span className="spread-count">{spread.count}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </main>
      
      <footer className="home-footer">
        <p>{t('footerMessage')}</p>
      </footer>
    </div>
  );
};

export default Home;
