import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { spreads, fullDeck } from '../data/tarotCards';
import { useLanguage } from '../i18n/LanguageContext';
import { generateTarotReading } from '../services/aiService';
import TarotCard from '../components/TarotCard';
import Navbar from '../components/Navbar';
import '../styles/Reading.css';

const Reading = () => {
  const { spreadType } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const spread = spreads[spreadType];
  
  const [phase, setPhase] = useState('question');
  const [question, setQuestion] = useState('');
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [revealedCount, setRevealedCount] = useState(0);
  
  // API 프리로딩 상태
  const [aiReading, setAiReading] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  const hasFetchedRef = useRef(false);

  // 22장 메이저 아르카나만 사용 (선택 간소화)
  const shuffleDeck = useMemo(() => {
    const majorArcana = fullDeck.filter(card => card.id <= 21);
    return [...majorArcana].sort(() => Math.random() - 0.5);
  }, []);

  const getFinalQuestion = () => {
    return question.trim() || t('defaultQuestion');
  };

  useEffect(() => {
    if (!spread) navigate('/');
  }, [spread, navigate]);

  // 모든 카드 공개되면 API 호출 시작
  useEffect(() => {
    if (revealedCount === selectedCards.length && 
        selectedCards.length > 0 && 
        !hasFetchedRef.current &&
        !aiReading) {
      hasFetchedRef.current = true;
      fetchAiReading();
    }
  }, [revealedCount, selectedCards.length]);

  const fetchAiReading = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    
    try {
      const reading = await generateTarotReading(
        selectedCards, 
        spread, 
        getFinalQuestion(), 
        language
      );
      setAiReading(reading);
    } catch (err) {
      setAiError(err.message);
    }
    
    setIsLoadingAI(false);
  };

  const startShuffle = () => {
    setPhase('shuffling');
    setTimeout(() => {
      setShuffledDeck(shuffleDeck);
      setPhase('selecting');
    }, 1800);
  };

  const selectCard = (card, index) => {
    if (selectedCards.length >= spread.cardCount) return;
    if (selectedCardIds.includes(card.id)) return;

    const drawnCard = {
      ...card,
      isReversed: Math.random() < 0.5,
      position: spread.positions[selectedCards.length]
    };
    
    setSelectedCardIds(prev => [...prev, card.id]);
    setSelectedCards(prev => [...prev, drawnCard]);

    if (selectedCards.length + 1 === spread.cardCount) {
      setTimeout(() => setPhase('revealing'), 500);
    }
  };

  const revealNext = () => {
    if (revealedCount < selectedCards.length) {
      setRevealedCount(prev => prev + 1);
    }
  };

  const revealAll = () => {
    setRevealedCount(selectedCards.length);
  };

  const goToResult = () => {
    navigate('/result', { 
      state: { 
        cards: selectedCards, 
        spread, 
        question: getFinalQuestion(),
        preloadedReading: aiReading,
        preloadedError: aiError
      } 
    });
  };

  if (!spread) return null;

  const allRevealed = revealedCount === selectedCards.length && selectedCards.length > 0;

  return (
    <div className="reading">
      <div className="stars"></div>
      <Navbar showBack />

      <main className="reading-content">
        <AnimatePresence mode="wait">
          {/* 질문 입력 */}
          {phase === 'question' && (
            <motion.div 
              className="phase question-phase"
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div 
                className="question-icon"
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔮
              </motion.div>
              <p className="phase-hint">{t('enterQuestion')}</p>
              
              <textarea
                className="question-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('questionPlaceholder')}
                rows={2}
              />
              
              <motion.button 
                className="btn btn-primary btn-glow"
                onClick={startShuffle}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {t('startReading')}
              </motion.button>
            </motion.div>
          )}

          {/* 셔플 */}
          {phase === 'shuffling' && (
            <motion.div 
              className="phase shuffle-phase"
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="shuffle-container">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="shuffle-card"
                    animate={{
                      x: [0, (i - 2) * 50, 0],
                      rotateY: [0, 180, 360],
                      rotateZ: [0, (i - 2) * 8, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: 1,
                      delay: i * 0.05,
                      ease: "easeInOut"
                    }}
                    style={{ zIndex: 5 - Math.abs(i - 2) }}
                  />
                ))}
              </div>
              <motion.p 
                className="shuffle-text"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {t('shuffling')}
              </motion.p>
            </motion.div>
          )}

          {/* 카드 선택 - 카드 더미 클릭 */}
          {phase === 'selecting' && (
            <motion.div 
              className="phase selecting-phase"
              key="selecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 선택된 카드 슬롯 */}
              <div className={`selected-slots ${spread.cardCount === 10 ? 'slots-10' : ''}`}>
                {spread.positions.map((pos, i) => {
                  const card = selectedCards[i];
                  return (
                    <motion.div 
                      key={i} 
                      className={`slot ${card ? 'filled' : ''}`}
                      animate={card ? { scale: [1.2, 1] } : {}}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {card ? (
                        <span className="slot-icon">✦</span>
                      ) : (
                        <span className="slot-num">{i + 1}</span>
                      )}
                      <span className="slot-name">{pos.name}</span>
                    </motion.div>
                  );
                })}
              </div>

              <p className="phase-hint select-hint">
                {t('selectCard')} <strong>{selectedCards.length}/{spread.cardCount}</strong>
              </p>

              {/* 카드 더미 - 클릭해서 뽑기 */}
              <div className="deck-stack-container">
                <motion.div 
                  className="deck-stack"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {shuffledDeck.map((card, index) => {
                    const isSelected = selectedCardIds.includes(card.id);
                    if (isSelected) return null;
                    
                    const offset = (shuffledDeck.length - selectedCards.length - index) * 0.5;
                    
                    return (
                      <motion.button
                        key={card.id}
                        className="stack-card"
                        onClick={() => selectCard(card, index)}
                        disabled={selectedCards.length >= spread.cardCount}
                        initial={{ y: 0 }}
                        animate={{ 
                          y: -offset,
                          x: offset * 0.3,
                        }}
                        whileHover={{ 
                          y: -offset - 10,
                          transition: { duration: 0.15 }
                        }}
                        exit={{ 
                          y: -100,
                          opacity: 0,
                          scale: 0.8,
                          transition: { duration: 0.3 }
                        }}
                        style={{ 
                          zIndex: index,
                        }}
                      >
                        <span className="card-symbol">✦</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
                <p className="deck-hint">{t('tapToDraw')}</p>
              </div>
            </motion.div>
          )}

          {/* 카드 공개 */}
          {phase === 'revealing' && (
            <motion.div 
              className="phase revealing-phase"
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="phase-hint">{t('tapToReveal')}</p>
              
              <div className={`reveal-grid grid-${spread.cardCount}`}>
                {selectedCards.map((card, index) => (
                  <motion.div 
                    key={card.id} 
                    className="reveal-item"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <TarotCard
                      card={card}
                      isRevealed={index < revealedCount}
                      onClick={() => index === revealedCount && revealNext()}
                      size="small"
                    />
                    <span className="reveal-label">{card.position.name}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* 로딩 표시 */}
              {allRevealed && isLoadingAI && (
                <motion.div 
                  className="preload-status"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="preload-spinner"></span>
                  <span>{t('aiAnalyzing')}</span>
                </motion.div>
              )}
              
              {/* 버튼 */}
              <div className="reveal-actions">
                {!allRevealed ? (
                  <motion.button 
                    className="btn btn-primary"
                    onClick={revealAll}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t('revealAll')}
                  </motion.button>
                ) : (
                  <motion.button 
                    className="btn btn-primary btn-glow"
                    onClick={goToResult}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t('seeResult')}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Reading;
