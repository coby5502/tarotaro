// ============================================
// Result Page
// 타로 리딩 결과 페이지 (AI 해석 통합)
// ============================================

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TarotCard from '../components/TarotCard';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';
import { generateTarotReading } from '../services/groqService';
import '../styles/Result.css';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { cards, spread, question } = location.state || {};
  
  const [aiReading, setAiReading] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 페이지 로드 시 자동으로 AI 해석 시작
  useEffect(() => {
    if (cards && spread) {
      fetchAiReading();
    }
  }, [cards, spread, language]);

  // AI 해석 생성
  const fetchAiReading = async () => {
    setIsLoading(true);
    setError('');
    setAiReading('');

    try {
      const reading = await generateTarotReading(cards, spread, question, language);
      setAiReading(reading);
    } catch (err) {
      setError(err.message);
    }

    setIsLoading(false);
  };

  if (!cards || !spread) {
    return (
      <div className="result">
        <div className="stars"></div>
        <div className="twinkling"></div>
        <div className="result-error">
          <p>{t('cannotLoad')}</p>
          <motion.button 
            className="action-button"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.03 }}
          >
            {t('backToHome')}
          </motion.button>
        </div>
      </div>
    );
  }

  const getSpreadKey = () => {
    if (spread.id === 'one-card') return 'oneCard';
    if (spread.id === 'three-card') return 'threeCard';
    return 'celticCross';
  };

  const getSpreadName = () => {
    if (spread.id === 'one-card') return t('oneCard');
    if (spread.id === 'three-card') return t('threeCard');
    return t('celticCross');
  };

  // 마크다운 파싱
  const parseMarkdown = (text) => {
    if (!text) return '';
    
    return text
      .split('\n')
      .map((line, index) => {
        // 헤더 처리
        if (line.startsWith('## ')) {
          return (
            <h3 key={index} className="ai-heading">
              {line.replace('## ', '')}
            </h3>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h4 key={index} className="ai-subheading">
              {line.replace('### ', '')}
            </h4>
          );
        }
        
        // 리스트 아이템 처리
        if (line.startsWith('- ')) {
          const content = line.replace('- ', '');
          return (
            <li key={index} className="ai-list-item">
              {parseBold(content)}
            </li>
          );
        }
        
        // 볼드 처리
        if (line.trim() === '') {
          return <div key={index} className="ai-spacer" />;
        }
        
        return (
          <p key={index} className="ai-paragraph">
            {parseBold(line)}
          </p>
        );
      });
  };

  // 볼드 텍스트 파싱
  const parseBold = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  return (
    <div className="result">
      <div className="stars"></div>
      <div className="twinkling"></div>
      
      <div className="result-top-bar">
        <motion.button 
          className="back-button"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
        >
          ← {t('backToHome')}
        </motion.button>
        <LanguageSelector />
      </div>
      
      <main className="result-main">
        <motion.header 
          className="result-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>✨ {t('readingResult')} ✨</h1>
          <p className="spread-name">{getSpreadName()}</p>
        </motion.header>

        {question && (
          <motion.div 
            className="question-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="question-label">{t('yourQuestion')}</span>
            <p>"{question}"</p>
          </motion.div>
        )}

        {/* 카드 미리보기 */}
        <motion.div 
          className="cards-overview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {cards.map((card, index) => (
            <motion.div 
              key={card.id} 
              className="card-overview-item"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <TarotCard card={card} isRevealed={true} size="small" />
              <div className="card-overview-info">
                <span className="card-position">{card.position.name}</span>
                <span className="card-name">{card.name.ko}</span>
                {card.isReversed && (
                  <span className="reversed-badge">{t('reversed')}</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI 해석 결과 */}
        <motion.section 
          className="reading-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">{t('aiAnalyzing')}</p>
              <p className="loading-sub">{t('pleaseWait')} ✨</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-text">❌ {error}</p>
              <motion.button
                className="retry-button"
                onClick={fetchAiReading}
                whileHover={{ scale: 1.02 }}
              >
                {t('retry')}
              </motion.button>
            </div>
          )}

          {aiReading && !isLoading && (
            <motion.div 
              className="ai-reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {parseMarkdown(aiReading)}
            </motion.div>
          )}
        </motion.section>

        {/* 푸터 */}
        <motion.footer 
          className="result-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="disclaimer">
            🔮 {t('disclaimer')}
          </p>

          <div className="action-buttons">
            <motion.button 
              className="action-button secondary"
              onClick={() => navigate(`/reading/${getSpreadKey()}`)}
              whileHover={{ scale: 1.03 }}
            >
              {t('drawAgain')}
            </motion.button>
            <motion.button 
              className="action-button"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.03 }}
            >
              {t('backToHome')}
            </motion.button>
          </div>
        </motion.footer>
      </main>
    </div>
  );
};

export default Result;
