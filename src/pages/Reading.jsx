import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { spreads, fullDeck } from '../data/tarotCards';
import { useLanguage } from '../i18n/LanguageContext';
import TarotCard from '../components/TarotCard';
import Navbar from '../components/Navbar';
import '../styles/Reading.css';

const Reading = () => {
  const { spreadType } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const spread = spreads[spreadType];
  
  const [phase, setPhase] = useState('question');
  const [question, setQuestion] = useState('');
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [revealedCount, setRevealedCount] = useState(0);

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
    }, 1200);
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
      setTimeout(() => setPhase('revealing'), 400);
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
    // 질문이 비어있으면 placeholder 텍스트를 기본 질문으로 사용
    const finalQuestion = question.trim() || t('defaultQuestion');
    navigate('/result', { 
      state: { cards: selectedCards, spread, question: finalQuestion } 
    });
  };

  if (!spread) return null;

  return (
    <div className="reading">
      <div className="stars"></div>
      <Navbar title={getSpreadName()} showBack />

      <main className="reading-content">
        <AnimatePresence mode="wait">
          {/* 질문 입력 */}
          {phase === 'question' && (
            <motion.div 
              className="phase question-phase"
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="phase-hint">{t('enterQuestion')}</p>
              
              <textarea
                className="question-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('questionPlaceholder')}
                rows={2}
              />
              
              <button className="btn btn-primary" onClick={startShuffle}>
                {t('startReading')}
              </button>
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
              <div className="shuffle-animation">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="shuffle-card"
                    animate={{
                      x: [0, -30, 30, 0],
                      rotateZ: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: 1,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
              <p className="shuffle-text">{t('shuffling')}</p>
            </motion.div>
          )}

          {/* 카드 선택 */}
          {phase === 'selecting' && (
            <motion.div 
              className="phase selecting-phase"
              key="selecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="phase-hint">
                {t('selectCard')} <strong>{selectedCards.length}/{spread.cardCount}</strong>
              </p>

              {/* 선택된 카드 슬롯 */}
              <div className="selected-slots">
                {spread.positions.map((pos, i) => {
                  const card = selectedCards[i];
                  return (
                    <div key={i} className={`slot ${card ? 'filled' : ''}`}>
                      {card ? <span className="slot-icon">✦</span> : <span className="slot-num">{i + 1}</span>}
                      <span className="slot-name">{pos.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* 카드 덱 */}
              <div className="card-deck">
                {shuffledDeck.map((card) => {
                  const isSelected = selectedCardIds.includes(card.id);
                  return (
                    <button
                      key={card.id}
                      className={`deck-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => !isSelected && selectCard(card)}
                      disabled={isSelected || selectedCards.length >= spread.cardCount}
                    >
                      <span>✦</span>
                    </button>
                  );
                })}
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
                  <div key={card.id} className="reveal-item">
                    <span className="reveal-label">{card.position.name}</span>
                    <TarotCard
                      card={card}
                      isRevealed={index < revealedCount}
                      onClick={() => index === revealedCount && revealNext()}
                      size="small"
                    />
                  </div>
                ))}
              </div>
              
              {/* 버튼 - 항상 카드 아래에 고정 */}
              <div className="reveal-actions">
                {revealedCount < selectedCards.length ? (
                  <button className="btn btn-primary" onClick={revealAll}>
                    {t('revealAll')}
                  </button>
                ) : (
                  <motion.button 
                    className="btn btn-primary"
                    onClick={goToResult}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
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
