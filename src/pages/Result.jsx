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
    
    const patterns = [
      /## ✨.*?\n([\s\S]*?)(?=\n##|$)/,
      /## 🎯.*?\n([\s\S]*?)(?=\n##|$)/,
    ];
    
    const maxLength = 50;
    
    for (const pattern of patterns) {
      const match = aiReading.match(pattern);
      if (match) {
        const text = match[1].trim().replace(/\*\*/g, '').replace(/\n/g, ' ');
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
      }
    }
    
    const firstParagraph = aiReading.split('\n').find(line => 
      line.trim() && !line.startsWith('#') && !line.startsWith('-')
    );
    const text = firstParagraph?.replace(/\*\*/g, '') || '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  };

  // 카드 이름 목록
  const getCardNames = () => {
    return cards.map(card => card.name.ko || card.name.en).join(', ');
  };

  // 이미지 저장
  const handleSaveImage = async () => {
    if (!shareCardRef.current) return;
    
    setIsGeneratingImage(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0a0a1a',
        scale: 2,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `tarotaro-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Image generation failed:', err);
      alert('이미지 생성에 실패했습니다.');
    }
    
    setIsGeneratingImage(false);
  };

  // 텍스트 복사
  const handleCopyText = () => {
    const text = `🔮 TaroTaro ${t('readingResult')}\n\n${question ? `Q: ${question}\n\n` : ''}${extractKeyMessage()}\n\n👉 www.tarotaro.co.kr`;
    navigator.clipboard.writeText(text);
    alert(t('copied') || 'Copied!');
  };

  // 링크 공유 (Web Share API 또는 클립보드)
  const handleShareLink = async () => {
    const shareData = {
      title: 'TaroTaro - 타로 리딩',
      text: `🔮 ${extractKeyMessage()}`,
      url: 'https://www.tarotaro.co.kr'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText('https://www.tarotaro.co.kr');
        alert(t('linkCopied') || '링크가 복사되었습니다!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        await navigator.clipboard.writeText('https://www.tarotaro.co.kr');
        alert(t('linkCopied') || '링크가 복사되었습니다!');
      }
    }
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
              onClick={() => setShowShareModal(true)}
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
              
              {/* 공유용 카드 (인라인 스타일로 안정적 캡처) */}
              <div 
                ref={shareCardRef}
                style={{
                  width: '320px',
                  background: 'linear-gradient(145deg, #1a1a3a, #0a0a1a)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  marginBottom: '20px',
                }}
              >
                {/* 헤더 */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(212, 175, 55, 0.2))',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '24px' }}>🔮</span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#d4af37',
                    letterSpacing: '0.05em',
                  }}>TaroTaro</span>
                </div>
                
                {/* 바디 */}
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#a78bfa',
                    marginBottom: '8px',
                    letterSpacing: '0.1em',
                  }}>{getSpreadName()}</p>
                  
                  {question && (
                    <p style={{
                      fontStyle: 'italic',
                      color: '#c4b5fd',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}>"{question}"</p>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '4px',
                    marginBottom: '16px',
                  }}>
                    {cards.slice(0, 4).map((card, i) => (
                      <span key={i} style={{
                        background: 'rgba(212, 175, 55, 0.15)',
                        color: '#d4af37',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: cards.length > 3 ? '10px' : '11px',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                      }}>
                        {card.name.ko || card.name.en}
                        {card.isReversed && ' ↺'}
                      </span>
                    ))}
                    {cards.length > 4 && (
                      <span style={{
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#a78bfa',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                      }}>
                        +{cards.length - 4}
                      </span>
                    )}
                  </div>
                  
                  <p style={{
                    color: '#e2e8f0',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  }}>✨ {extractKeyMessage()}</p>
                </div>
                
                {/* 푸터 */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  textAlign: 'center',
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    letterSpacing: '0.1em',
                  }}>www.tarotaro.co.kr</span>
                </div>
              </div>

              <div className="share-actions">
                {isGeneratingImage ? (
                  <p className="generating-text">{t('generatingImage')}...</p>
                ) : (
                  <>
                    <motion.button 
                      className="share-action-btn"
                      onClick={handleSaveImage}
                      whileHover={{ scale: 1.02 }}
                    >
                      📥 {t('saveImage')}
                    </motion.button>
                    <motion.button 
                      className="share-action-btn secondary"
                      onClick={handleShareLink}
                      whileHover={{ scale: 1.02 }}
                    >
                      🔗 {t('shareLink')}
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
