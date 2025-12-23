import { useState, useEffect } from 'react';
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
  const [selectedCards, setSelectedCards] = useState([]);
  const [revealedCount, setRevealedCount] = useState(0);

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
      const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
      setShuffledDeck(shuffled);
      setPhase('selecting');
    }, 2000);
  };

  const selectCard = (card, index) => {
    if (selectedCards.length >= spread.cardCount) return;
    if (selectedCards.find(c => c.id === card.id)) return;

    const drawnCard = {
      ...card,
      isReversed: Math.random() < 0.5,
      position: spread.positions[selectedCards.length]
    };
    
    const newSelected = [...selectedCards, drawnCard];
    setSelectedCards(newSelected);
    setShuffledDeck(prev => prev.filter((_, i) => i !== index));

    if (newSelected.length === spread.cardCount) {
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
                      x: [0, -60, 60, -30, 30, 0],
                      rotateZ: [0, -8, 8, -4, 4, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: 1,
                      delay: i * 0.05,
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
              <div className="progress-area">
                <p className="phase-desc">
                  {t('selectCard')} ({selectedCards.length}/{spread.cardCount})
                </p>
                <div className="progress-bar">
                  <motion.div 
                    className="progress-fill"
                    animate={{ width: `${(selectedCards.length / spread.cardCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* 선택된 카드 - 뒤집은 채로 */}
              {selectedCards.length > 0 && (
                <div className="selected-cards-row">
                  {selectedCards.map((card, i) => (
                    <motion.div 
                      key={card.id}
                      className="selected-card-slot"
                      initial={{ scale: 0, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="card-back-mini">
                        <span>✦</span>
                      </div>
                      <span className="slot-label">{card.position.name}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 카드 덱 */}
              <div className="deck-area">
                <div className="card-deck">
                  {shuffledDeck.slice(0, 15).map((card, index) => (
                    <motion.button
                      key={card.id}
                      className="deck-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ y: -12, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectCard(card, index)}
                    >
                      <span className="deck-card-symbol">✦</span>
                    </motion.button>
                  ))}
                </div>
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
                    {t('revealAll') || '모두 공개'} ✨
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
