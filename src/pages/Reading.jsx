import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { spreads, fullDeck } from '../data/tarotCards';
import { useLanguage } from '../i18n/LanguageContext';
import TarotCard from '../components/TarotCard';
import LanguageSelector from '../components/LanguageSelector';
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

  // 카드 섞기 (한 번만)
  const shuffleDeck = useMemo(() => {
    return [...fullDeck].sort(() => Math.random() - 0.5);
  }, []);

  const getSpreadName = () => {
    if (spreadType === 'oneCard') return t('oneCard');
    if (spreadType === 'threeCard') return t('threeCard');
    return t('celticCross');
  };

  useEffect(() => {
    if (!spread) navigate('/');
  }, [spread, navigate]);

  const startShuffle = () => {
    setPhase('shuffling');
    setTimeout(() => {
      setShuffledDeck(shuffleDeck);
      setPhase('selecting');
    }, 1500);
  };

  const selectCard = (card) => {
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
      state: { cards: selectedCards, spread, question, language } 
    });
  };

  if (!spread) return null;

  return (
    <div className="reading">
      <div className="stars"></div>
      
      <div className="reading-top-bar">
        <motion.button 
          className="back-button"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
        >
          ← {t('backToHome')}
        </motion.button>
        <LanguageSelector />
      </div>

      <main className="reading-main">
        <motion.h1 
          className="reading-title"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {getSpreadName()}
        </motion.h1>

        <AnimatePresence mode="wait">
          {/* 질문 입력 */}
          {phase === 'question' && (
            <motion.section 
              className="phase-section"
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="phase-desc">
                {t('enterQuestion')}
              </p>
              
              <textarea
                className="question-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('questionPlaceholder')}
                rows={3}
              />
              
              <motion.button 
                className="action-button"
                onClick={startShuffle}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('startReading')} 🔮
              </motion.button>
            </motion.section>
          )}

          {/* 셔플 애니메이션 */}
          {phase === 'shuffling' && (
            <motion.section 
              className="phase-section shuffle-section"
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="shuffle-deck">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="shuffle-card"
                    style={{ zIndex: 5 - i }}
                    animate={{
                      x: [0, -50, 50, -25, 25, 0],
                      rotateZ: [0, -5, 5, -3, 3, 0],
                    }}
                    transition={{
                      duration: 1,
                      repeat: 1,
                      delay: i * 0.03,
                    }}
                  />
                ))}
              </div>
              <p className="shuffle-text">{t('shuffling')}</p>
            </motion.section>
          )}

          {/* 카드 선택 */}
          {phase === 'selecting' && (
            <motion.section 
              className="phase-section selecting-section"
              key="selecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 진행 상황 */}
              <div className="select-header">
                <p className="phase-desc">
                  {t('selectCard')} <strong>({selectedCards.length}/{spread.cardCount})</strong>
                </p>
              </div>

              {/* 선택된 카드 표시 */}
              {selectedCards.length > 0 && (
                <div className="selected-slots">
                  {selectedCards.map((card, i) => (
                    <div key={card.id} className="selected-slot">
                      <div className="slot-card-back">✦</div>
                      <span className="slot-label">{card.position.name}</span>
                    </div>
                  ))}
                  {/* 빈 슬롯 */}
                  {Array.from({ length: spread.cardCount - selectedCards.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="selected-slot empty">
                      <div className="slot-empty">{selectedCards.length + i + 1}</div>
                      <span className="slot-label">{spread.positions[selectedCards.length + i]?.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 전체 카드 펼침 */}
              <div className="card-spread">
                {shuffledDeck.map((card, index) => {
                  const isSelected = selectedCardIds.includes(card.id);
                  return (
                    <motion.button
                      key={card.id}
                      className={`spread-card-btn ${isSelected ? 'selected' : ''}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: isSelected ? 0.3 : 1, 
                        scale: isSelected ? 0.9 : 1 
                      }}
                      whileHover={!isSelected ? { scale: 1.1, zIndex: 10 } : {}}
                      whileTap={!isSelected ? { scale: 0.95 } : {}}
                      onClick={() => !isSelected && selectCard(card)}
                      disabled={isSelected || selectedCards.length >= spread.cardCount}
                      transition={{ delay: index * 0.005 }}
                    >
                      <span className="card-back-icon">✦</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* 카드 공개 */}
          {phase === 'revealing' && (
            <motion.section 
              className="phase-section revealing-section"
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="reveal-header">
                <p className="phase-desc">{t('selectCard')}</p>
                {revealedCount < selectedCards.length && (
                  <motion.button
                    className="reveal-all-btn"
                    onClick={revealAll}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('revealAll')} ✨
                  </motion.button>
                )}
              </div>
              
              <div className={`reveal-grid reveal-grid-${spread.cardCount}`}>
                {selectedCards.map((card, index) => (
                  <motion.div 
                    key={card.id} 
                    className="reveal-slot"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="reveal-label">{card.position.name}</span>
                    <TarotCard
                      card={card}
                      isRevealed={index < revealedCount}
                      onClick={() => index === revealedCount && revealNext()}
                      size="small"
                    />
                  </motion.div>
                ))}
              </div>
              
              {revealedCount === selectedCards.length && (
                <motion.button 
                  className="action-button"
                  onClick={goToResult}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.03 }}
                >
                  {t('seeResult')} ✨
                </motion.button>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Reading;
