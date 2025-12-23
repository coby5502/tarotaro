// ============================================
// Result Page
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import TarotCard from '../components/TarotCard';
import Navbar from '../components/Navbar';
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
  const [selectedCard, setSelectedCard] = useState(null);

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

  const extractKeyMessage = () => {
    if (!aiReading) return '';
    const patterns = [/## ✨.*?\n([\s\S]*?)(?=\n##|$)/, /## 🎯.*?\n([\s\S]*?)(?=\n##|$)/];
    for (const pattern of patterns) {
      const match = aiReading.match(pattern);
      if (match) {
        const text = match[1].trim().replace(/\*\*/g, '').replace(/\n/g, ' ');
        return text.length > 40 ? text.substring(0, 37) + '...' : text;
      }
    }
    return '';
  };

  const handleSaveImage = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingImage(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0c0c14',
        scale: 2,
        logging: false,
        useCORS: true,
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

  const handleCopyText = () => {
    const text = `🔮 TaroTaro\n\n${question ? `Q: ${question}\n\n` : ''}${extractKeyMessage()}\n\n👉 www.tarotaro.co.kr`;
    navigator.clipboard.writeText(text);
    alert(t('copied') || 'Copied!');
  };

  if (!cards || !spread) {
    return (
      <div className="result">
        <div className="stars"></div>
        <Navbar />
        <div className="result-error">
          <p>{t('cannotLoad')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            {t('backToHome')}
          </button>
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
    return text.split('\n').map((line, index) => {
      if (line.startsWith('## ')) return <h3 key={index} className="md-h2">{line.replace('## ', '')}</h3>;
      if (line.startsWith('### ')) return <h4 key={index} className="md-h3">{line.replace('### ', '')}</h4>;
      if (line.startsWith('- ')) return <li key={index} className="md-li">{parseBold(line.replace('- ', ''))}</li>;
      if (line.trim() === '') return <div key={index} className="md-space" />;
      return <p key={index} className="md-p">{parseBold(line)}</p>;
    });
  };

  const parseBold = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
  };

  return (
    <div className="result">
      <div className="stars"></div>
      <Navbar title={getSpreadName()} showBack />
      
      <main className="result-content">
        {question && (
          <motion.div className="result-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            "{question}"
          </motion.div>
        )}

        {/* 카드 */}
        <motion.div 
          className={`result-cards cards-${cards.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {cards.map((card, index) => (
            <motion.div 
              key={card.id} 
              className="result-card-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedCard(card)}
            >
              <TarotCard card={card} isRevealed={true} size="small" />
              <span className="result-card-label">{card.position.name}</span>
            </motion.div>
          ))}
        </motion.div>
        <p className="card-tap-hint">{t('clickToEnlarge')}</p>

        {/* AI 해석 */}
        <motion.div 
          className="result-reading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>{t('aiAnalyzing')}</p>
            </div>
          )}

          {error && (
            <div className="error">
              <p>❌ {error}</p>
              <button className="btn btn-secondary" onClick={fetchAiReading}>{t('retry')}</button>
            </div>
          )}

          {aiReading && !isLoading && (
            <div className="reading-text">{parseMarkdown(aiReading)}</div>
          )}
        </motion.div>

        {/* 버튼들 */}
        {aiReading && !isLoading && (
          <motion.div 
            className="result-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button className="btn btn-primary" onClick={() => setShowShareModal(true)}>
              📤 {t('shareResult')}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(`/reading/${getSpreadKey()}`)}>
              {t('drawAgain')}
            </button>
          </motion.div>
        )}

        <p className="disclaimer">{t('disclaimer')}</p>
      </main>

      {/* 카드 상세 모달 */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              className="card-detail-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedCard(null)}>×</button>
              <div className={`card-detail-img ${selectedCard.isReversed ? 'reversed' : ''}`}>
                <img src={selectedCard.image} alt={selectedCard.name.ko} />
              </div>
              <div className="card-detail-info">
                <h3>{selectedCard.name.ko || selectedCard.name.en}</h3>
                <p className="card-detail-position">{selectedCard.position.name}</p>
                {selectedCard.isReversed && <span className="reversed-badge">{t('reversed')}</span>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 공유 모달 */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              className="share-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowShareModal(false)}>×</button>
              
              {/* 공유용 이미지 - 카드 이미지 포함 */}
              <div ref={shareCardRef} className="share-card">
                <div className="share-header">
                  <span>🔮</span>
                  <span>TaroTaro</span>
                </div>
                <div className="share-body">
                  <p className="share-spread">{getSpreadName()}</p>
                  {question && <p className="share-question">"{question}"</p>}
                  
                  {/* 카드 이미지들 */}
                  <div className="share-cards-row">
                    {cards.slice(0, 3).map((card, i) => (
                      <div key={i} className={`share-card-img ${card.isReversed ? 'reversed' : ''}`}>
                        <img src={card.image} alt="" crossOrigin="anonymous" />
                      </div>
                    ))}
                  </div>
                  {cards.length > 3 && <p className="share-more">+{cards.length - 3} more</p>}
                  
                  <p className="share-message">✨ {extractKeyMessage()}</p>
                </div>
                <div className="share-footer">www.tarotaro.co.kr</div>
              </div>

              <div className="share-buttons">
                {isGeneratingImage ? (
                  <p className="generating">{t('generatingImage')}...</p>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={handleSaveImage}>📥 {t('saveImage')}</button>
                    <button className="btn btn-secondary" onClick={handleCopyText}>📋 {t('copyText')}</button>
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
