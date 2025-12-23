// ============================================
// Result Page
// 타로 리딩 결과 페이지
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
    }
    
    setIsGeneratingImage(false);
  };

  // 텍스트 복사
  const handleCopyText = () => {
    const text = `🔮 TaroTaro\n\n${question ? `Q: ${question}\n\n` : ''}${extractKeyMessage()}\n\n👉 www.tarotaro.co.kr`;
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
          ←
        </motion.button>
        <span className="top-bar-title">{getSpreadName()}</span>
        <LanguageSelector />
      </div>
      
      <main className="result-main">
        {question && (
          <motion.div 
            className="question-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>"{question}"</p>
          </motion.div>
        )}

        {/* 카드 미리보기 */}
        <motion.div 
          className={`cards-overview cards-count-${cards.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {cards.map((card, index) => (
            <motion.div 
              key={card.id} 
              className="card-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
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
          transition={{ delay: 0.2 }}
        >
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">{t('aiAnalyzing')}</p>
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

        {/* 하단 버튼들 */}
        {aiReading && !isLoading && (
          <motion.div 
            className="result-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button 
              className="action-btn share"
              onClick={() => setShowShareModal(true)}
              whileHover={{ scale: 1.02 }}
            >
              📤 {t('shareResult')}
            </motion.button>
            
            <motion.button 
              className="action-btn secondary"
              onClick={() => navigate(`/reading/${getSpreadKey()}`)}
              whileHover={{ scale: 1.02 }}
            >
              🔄 {t('drawAgain')}
            </motion.button>
            
            <motion.button 
              className="action-btn secondary"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.02 }}
            >
              🏠 {t('backToHome')}
            </motion.button>
          </motion.div>
        )}

        <p className="disclaimer">
          {t('disclaimer')}
        </p>
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
              <div 
                ref={shareCardRef}
                style={{
                  width: '300px',
                  background: 'linear-gradient(145deg, #1a1a3a, #0a0a1a)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  marginBottom: '16px',
                }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(212, 175, 55, 0.2))',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '22px' }}>🔮</span>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#d4af37',
                  }}>TaroTaro</span>
                </div>
                
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <p style={{
                    fontSize: '11px',
                    color: '#a78bfa',
                    marginBottom: '6px',
                  }}>{getSpreadName()}</p>
                  
                  {question && (
                    <p style={{
                      fontStyle: 'italic',
                      color: '#c4b5fd',
                      fontSize: '12px',
                      marginBottom: '10px',
                    }}>"{question}"</p>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '4px',
                    marginBottom: '12px',
                  }}>
                    {cards.slice(0, 3).map((card, i) => (
                      <span key={i} style={{
                        background: 'rgba(212, 175, 55, 0.15)',
                        color: '#d4af37',
                        padding: '3px 7px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                      }}>
                        {card.name.ko || card.name.en}
                      </span>
                    ))}
                    {cards.length > 3 && (
                      <span style={{
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#a78bfa',
                        padding: '3px 7px',
                        borderRadius: '8px',
                        fontSize: '10px',
                      }}>+{cards.length - 3}</span>
                    )}
                  </div>
                  
                  <p style={{
                    color: '#e2e8f0',
                    fontSize: '12px',
                    lineHeight: '1.5',
                  }}>✨ {extractKeyMessage()}</p>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '10px',
                  textAlign: 'center',
                }}>
                  <span style={{
                    fontSize: '10px',
                    color: '#94a3b8',
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
