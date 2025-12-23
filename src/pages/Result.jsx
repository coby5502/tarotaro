// ============================================
// Result Page
// 타로 리딩 결과 페이지 (AI 해석 통합)
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
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
  const shareCardRef = useRef(null);
  
  const [aiReading, setAiReading] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    if (cards && spread) {
      fetchAiReading();
    }
  }, [cards, spread, language]);

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

  // 핵심 메시지 추출
  const extractKeyMessage = () => {
    if (!aiReading) return '';
    
    // ✨ 핵심 메시지 또는 Key Message 섹션 찾기
    const patterns = [
      /## ✨.*?\n([\s\S]*?)(?=\n##|$)/,
      /## 🎯.*?\n([\s\S]*?)(?=\n##|$)/,
    ];
    
    for (const pattern of patterns) {
      const match = aiReading.match(pattern);
      if (match) {
        return match[1].trim().replace(/\*\*/g, '').substring(0, 200);
      }
    }
    
    // 못 찾으면 첫 문단 반환
    const firstParagraph = aiReading.split('\n').find(line => 
      line.trim() && !line.startsWith('#') && !line.startsWith('-')
    );
    return firstParagraph?.replace(/\*\*/g, '').substring(0, 200) || '';
  };

  // 이미지 생성 및 저장
  const handleShare = async () => {
    setShowShareModal(true);
    setIsGeneratingImage(true);
    
    // 모달이 렌더링될 때까지 대기
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (shareCardRef.current) {
      try {
        const canvas = await html2canvas(shareCardRef.current, {
          backgroundColor: '#0a0a1a',
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        
        const link = document.createElement('a');
        link.download = `tarotaro-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Image generation failed:', err);
      }
    }
    
    setIsGeneratingImage(false);
  };

  // 클립보드에 복사
  const handleCopyText = () => {
    const text = `🔮 TaroTaro ${t('readingResult')}\n\n${question ? `Q: ${question}\n\n` : ''}${extractKeyMessage()}\n\ntarotaro.vercel.app`;
    navigator.clipboard.writeText(text);
    alert(t('copied') || 'Copied!');
  };

  if (!cards || !spread) {
    return (
      <div className="result">
        <div className="stars"></div>
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

  const parseMarkdown = (text) => {
    if (!text) return '';
    
    return text
      .split('\n')
      .map((line, index) => {
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
        
        if (line.startsWith('- ')) {
          const content = line.replace('- ', '');
          return (
            <li key={index} className="ai-list-item">
              {parseBold(content)}
            </li>
          );
        }
        
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

  const parseBold = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  return (
    <div className="result">
      <div className="stars"></div>
      
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
          className={`cards-overview cards-count-${cards.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {cards.map((card, index) => (
            <motion.div 
              key={card.id} 
              className="card-item"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.03 }}
            >
              <TarotCard card={card} isRevealed={true} size="small" />
              <span className="card-position">{card.position.name}</span>
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

        {/* 공유 버튼 */}
        {aiReading && !isLoading && (
          <motion.div 
            className="share-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button 
              className="share-button"
              onClick={handleShare}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              📤 {t('shareResult')}
            </motion.button>
          </motion.div>
        )}

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

      {/* 공유 모달 */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            className="share-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              className="share-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="close-modal" onClick={() => setShowShareModal(false)}>×</button>
              
              {/* 공유용 카드 */}
              <div className="share-card" ref={shareCardRef}>
                <div className="share-card-header">
                  <span className="share-logo">🔮</span>
                  <span className="share-title">TaroTaro</span>
                </div>
                
                <div className="share-card-body">
                  {question && (
                    <p className="share-question">"{question}"</p>
                  )}
                  
                  <div className="share-cards">
                    {cards.slice(0, 3).map((card, i) => (
                      <div key={i} className="share-card-item">
                        <img src={card.image} alt={card.name.en} />
                      </div>
                    ))}
                    {cards.length > 3 && (
                      <span className="share-more">+{cards.length - 3}</span>
                    )}
                  </div>
                  
                  <p className="share-message">{extractKeyMessage()}</p>
                </div>
                
                <div className="share-card-footer">
                  <span>tarotaro.vercel.app</span>
                </div>
              </div>

              <div className="share-actions">
                {isGeneratingImage ? (
                  <p className="generating-text">{t('generatingImage')}...</p>
                ) : (
                  <>
                    <motion.button 
                      className="share-action-btn"
                      onClick={handleShare}
                      whileHover={{ scale: 1.02 }}
                    >
                      📥 {t('saveImage')}
                    </motion.button>
                    <motion.button 
                      className="share-action-btn secondary"
                      onClick={handleCopyText}
                      whileHover={{ scale: 1.02 }}
                    >
                      📋 {t('copyText')}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Result;
