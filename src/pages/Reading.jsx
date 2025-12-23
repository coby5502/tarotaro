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
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  
  // API 프리로딩 상태
  const [aiReading, setAiReading] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  const hasFetchedRef = useRef(false);

  const shuffleDeck = useMemo(() => {
    return [...fullDeck].sort(() => Math.random() - 0.5);
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
    }, 2000);
  };

  const selectCard = (card, index) => {
    if (selectedCards.length >= spread.cardCount) return;
    if (selectedCardIds.includes(card.id)) return;

    setLastSelectedIndex(index);

    const drawnCard = {
      ...card,
      isReversed: Math.random() < 0.5,
      position: spread.positions[selectedCards.length]
    };
    
    setSelectedCardIds(prev => [...prev, card.id]);
    setSelectedCards(prev => [...prev, drawnCard]);

    if (selectedCards.length + 1 === spread.cardCount) {
      setTimeout(() => setPhase('revealing'), 600);
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
  const totalCards = shuffledDeck.length;

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
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('startReading')}
              </motion.button>
            </motion.div>
          )}

          {/* 셔플 - 화려한 애니메이션 */}
          {phase === 'shuffling' && (
            <motion.div 
              className="phase shuffle-phase"
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="shuffle-container">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="shuffle-card"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      rotateZ: 0,
                      rotateY: 0 
                    }}
                    animate={{
                      x: [0, (i - 3) * 40, 0, (3 - i) * 40, 0],
                      y: [0, -20, 0, -20, 0],
                      rotateZ: [0, (i - 3) * 5, 0, (3 - i) * 5, 0],
                      rotateY: [0, 180, 360, 180, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: 1,
                      delay: i * 0.03,
                      ease: "easeInOut"
                    }}
                    style={{ zIndex: 7 - i }}
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

          {/* 카드 선택 - 부채꼴 배치 */}
          {phase === 'selecting' && (
            <motion.div 
              className="phase selecting-phase"
              key="selecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* 선택된 카드 슬롯 */}
              <div className="selected-slots">
                {spread.positions.map((pos, i) => {
                  const card = selectedCards[i];
                  const isJustSelected = selectedCards.length - 1 === i && lastSelectedIndex !== null;
                  return (
                    <motion.div 
                      key={i} 
                      className={`slot ${card ? 'filled' : ''}`}
                      initial={isJustSelected ? { scale: 0, rotateY: 180 } : false}
                      animate={isJustSelected ? { scale: 1, rotateY: 0 } : {}}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {card ? (
                        <motion.span 
                          className="slot-icon"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          ✦
                        </motion.span>
                      ) : (
                        <span className="slot-num">{i + 1}</span>
                      )}
                      <span className="slot-name">{pos.name}</span>
                    </motion.div>
                  );
                })}
              </div>

              <p className="phase-hint">
                {t('selectCard')} <strong>{selectedCards.length}/{spread.cardCount}</strong>
              </p>

              {/* 카드 덱 - 부채꼴 */}
              <div className="fan-deck-container">
                <div className="fan-deck">
                  {shuffledDeck.map((card, index) => {
                    const isSelected = selectedCardIds.includes(card.id);
                    const angle = ((index - totalCards / 2) / totalCards) * 60;
                    const radius = 280;
                    const x = Math.sin(angle * Math.PI / 180) * radius;
                    const y = -Math.cos(angle * Math.PI / 180) * radius + radius;
                    
                    return (
                      <motion.button
                        key={card.id}
                        className={`fan-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => !isSelected && selectCard(card, index)}
                        disabled={isSelected || selectedCards.length >= spread.cardCount}
                        initial={{ 
                          x: 0, 
                          y: 200, 
                          rotate: 0,
                          opacity: 0 
                        }}
                        animate={{ 
                          x: x,
                          y: y,
                          rotate: angle,
                          opacity: isSelected ? 0 : 1,
                          scale: isSelected ? 0.5 : 1,
                        }}
                        whileHover={!isSelected ? { 
                          y: y - 30,
                          scale: 1.15,
                          zIndex: 100,
                          transition: { duration: 0.2 }
                        } : {}}
                        transition={{ 
                          duration: 0.5, 
                          delay: index * 0.01,
                          type: "spring",
                          stiffness: 100
                        }}
                        style={{ 
                          zIndex: isSelected ? 0 : totalCards - Math.abs(index - totalCards / 2),
                          transformOrigin: 'bottom center'
                        }}
                      >
                        <span className="card-symbol">✦</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* 카드 공개 */}
          {phase === 'revealing' && (
            <motion.div 
              className="phase revealing-phase"
              key="revealing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="phase-hint">{t('tapToReveal')}</p>
              
              <div className={`reveal-grid grid-${spread.cardCount}`}>
                {selectedCards.map((card, index) => (
                  <motion.div 
                    key={card.id} 
                    className="reveal-item"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('revealAll')}
                  </motion.button>
                ) : (
                  <motion.button 
                    className="btn btn-primary btn-glow"
                    onClick={goToResult}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
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
