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
  const [clickingCardId, setClickingCardId] = useState(null);
  
  // API 프리로딩 상태
  const [aiReading, setAiReading] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  const hasFetchedRef = useRef(false);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const scrollStartX = useRef(0);
  const scrollStartY = useRef(0);
  const scrollLeft = useRef(0);
  const dragStartRef = useRef(null);
  const cardDragDirectionRef = useRef(new Map()); // 카드별 드래그 방향 추적

  // 전체 덱 섞기
  const shuffleDeck = useMemo(() => {
    return [...fullDeck].sort(() => Math.random() - 0.5);
  }, []);

  const getFinalQuestion = () => {
    return question.trim() || t('defaultQuestion');
  };

  const getSpreadName = () => {
    if (spreadType === 'oneCard') return t('oneCard');
    if (spreadType === 'threeCard') return t('threeCard');
    return t('celticCross');
  };

  useEffect(() => {
    if (!spread) navigate('/');
  }, [spread, navigate]);

  // 초기 스크롤 위치를 중앙으로 설정
  useEffect(() => {
    if (phase === 'selecting' && scrollRef.current && shuffledDeck.length > 0) {
      // 짧은 지연 후 스크롤 위치 설정 (렌더링 완료 대기)
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          const totalWidth = (shuffledDeck.length - 1) * 35; // 마지막 카드의 위치
          const containerWidth = scrollRef.current.clientWidth;
          const scrollLeft = Math.max(0, (totalWidth - containerWidth) / 2);
          scrollRef.current.scrollLeft = scrollLeft;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phase, shuffledDeck.length]);

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
    }, 1500);
  };

  const selectCard = (card) => {
    if (selectedCards.length >= spread.cardCount) return;
    if (selectedCardIds.includes(card.id)) return;

    // 클릭 애니메이션 시작
    setClickingCardId(card.id);
    
    setTimeout(() => {
      const drawnCard = {
        ...card,
        isReversed: Math.random() < 0.5,
        position: spread.positions[selectedCards.length]
      };
      
      setSelectedCardIds(prev => [...prev, card.id]);
      setSelectedCards(prev => [...prev, drawnCard]);
      
      // 애니메이션 완료 후 상태 초기화
      setTimeout(() => {
        setClickingCardId(null);
      }, 200);

      if (selectedCards.length + 1 === spread.cardCount) {
        setTimeout(() => setPhase('revealing'), 600);
      }
    }, 400); // 애니메이션 시간 증가
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

          {/* 카드 선택 - 그리드 레이아웃 */}
          {phase === 'selecting' && (
            <motion.div 
              className="phase selecting-phase"
              key="selecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="phase-hint select-hint">
                {t('selectCard')} <strong>{selectedCards.length}/{spread.cardCount}</strong>
              </p>

              {/* 선택된 카드 슬롯 */}
              <div className={`selected-slots ${spread.cardCount === 10 ? 'slots-10' : ''}`}>
                {spread.positions.map((pos, i) => {
                  const card = selectedCards[i];
                  return (
                    <div 
                      key={i} 
                      className={`slot ${card ? 'filled' : ''}`}
                    >
                      {card ? (
                        <div className="slot-card">
                          <TarotCard 
                            card={card} 
                            isRevealed={false} 
                            size="small"
                          />
                        </div>
                      ) : (
                        <div className="slot-empty">
                          <span className="slot-num">{i + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 카드 부채꼴 배치 - 스크롤 가능 */}
              <div className="card-fan-container" ref={containerRef}>
                <div 
                  className="card-fan-scroll"
                  ref={scrollRef}
                  onMouseDown={(e) => {
                    // 카드 위에서도 가로 드래그 감지를 위해 항상 드래그 시작 정보 저장
                    setIsDraggingScroll(true);
                    dragStartRef.current = { x: e.pageX, y: e.pageY };
                    scrollStartX.current = e.pageX - scrollRef.current.offsetLeft;
                    scrollLeft.current = scrollRef.current.scrollLeft;
                  }}
                  onMouseLeave={() => {
                    setIsDraggingScroll(false);
                    dragStartRef.current = null;
                  }}
                  onMouseUp={() => {
                    setIsDraggingScroll(false);
                    dragStartRef.current = null;
                  }}
                  onMouseMove={(e) => {
                    if (!isDraggingScroll || !scrollRef.current || !dragStartRef.current) return;
                    
                    const deltaX = Math.abs(e.pageX - dragStartRef.current.x);
                    const deltaY = Math.abs(e.pageY - dragStartRef.current.y);
                    
                    // 가로 드래그가 세로 드래그보다 크면 스크롤 (감도 개선)
                    if (deltaX > deltaY && deltaX > 15) {
                      e.preventDefault();
                      const x = e.pageX - scrollRef.current.offsetLeft;
                      const walk = (x - scrollStartX.current) * 1.5;
                      scrollRef.current.scrollLeft = scrollLeft.current - walk;
                    }
                  }}
                  onWheel={(e) => {
                    // 마우스 휠로 가로 스크롤 (감도 개선)
                    if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                      e.preventDefault();
                      scrollRef.current.scrollLeft += e.deltaY * 0.8;
                    }
                  }}
                >
                  <div className="card-fan-inner">
                    {shuffledDeck.map((card, index) => {
                      const isSelected = selectedCardIds.includes(card.id);
                      const isDisabled = selectedCards.length >= spread.cardCount;
                      const isClicking = clickingCardId === card.id;
                      
                      // 가로 위치 - 첫 카드가 왼쪽에서 시작, 35px 간격으로 배치
                      const horizontalOffset = index * 35;
                      
                      return (
                        <motion.div
                          key={card.id}
                          className={`fan-card-wrapper ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                          drag={!isSelected && !isDisabled && !isClicking ? "y" : false}
                          dragConstraints={(info, { point }) => {
                            // 드래그 방향 확인
                            if (!cardDragDirectionRef.current.has(card.id)) {
                              cardDragDirectionRef.current.set(card.id, null);
                            }
                            
                            if (dragStartRef.current) {
                              const deltaX = Math.abs(point.x - dragStartRef.current.x);
                              const deltaY = Math.abs(point.y - dragStartRef.current.y);
                              
                              // 가로 드래그가 세로보다 크면 가로 드래그로 표시
                              if (deltaX > deltaY && deltaX > 10) {
                                cardDragDirectionRef.current.set(card.id, 'horizontal');
                                // 가로 스크롤 적용
                                if (scrollRef.current) {
                                  const walk = (point.x - dragStartRef.current.x) * 1.2;
                                  scrollRef.current.scrollLeft = scrollLeft.current - walk;
                                }
                              } else if (deltaY > deltaX && deltaY > 10) {
                                cardDragDirectionRef.current.set(card.id, 'vertical');
                              }
                            }
                            
                            // 가로 드래그 중이면 y 드래그 제약
                            const dragDirection = cardDragDirectionRef.current.get(card.id);
                            if (dragDirection === 'horizontal') {
                              return { top: 0, bottom: 0 }; // y 이동 제한
                            }
                            
                            return { top: -200, bottom: 0 };
                          }}
                          dragElastic={{ top: 0.1, bottom: 0.5 }}
                          onDragStart={(e, info) => {
                            // 드래그 시작 시점 저장 (가로/세로 구분용)
                            dragStartRef.current = { x: e.pageX, y: e.pageY };
                            cardDragDirectionRef.current.set(card.id, null);
                            if (scrollRef.current) {
                              scrollLeft.current = scrollRef.current.scrollLeft;
                            }
                          }}
                          onDragEnd={(e, info) => {
                            const dragDirection = cardDragDirectionRef.current.get(card.id);
                            cardDragDirectionRef.current.delete(card.id);
                            
                            // 세로 드래그일 때만 카드 선택
                            if (dragDirection !== 'horizontal' && info.offset.y < -80 && Math.abs(info.offset.x) < Math.abs(info.offset.y) * 0.8) {
                              selectCard(card);
                            }
                          }}
                          initial={{ 
                            opacity: 0,
                            scale: 0.9,
                          }}
                          animate={{ 
                            opacity: isSelected ? 0 : 1,
                            x: 0,
                            y: isClicking ? -200 : 0,
                            rotate: 0,
                            scale: isClicking ? 1.3 : 1,
                          }}
                          whileTap={!isSelected && !isDisabled && !isClicking ? { scale: 0.95 } : {}}
                          transition={{ 
                            delay: index * 0.01,
                            type: "spring",
                            stiffness: isClicking ? 400 : 200,
                            damping: isClicking ? 30 : 20,
                            layout: false
                          }}
                          style={{
                            position: 'absolute',
                            left: `${horizontalOffset}px`,
                            bottom: '100px',
                            transformOrigin: 'center bottom',
                            cursor: isSelected || isDisabled || isClicking ? 'default' : 'grab',
                            zIndex: isClicking ? 10000 : index,
                            pointerEvents: isSelected || isClicking ? 'none' : 'auto',
                          }}
                          onClick={() => !isSelected && !isDisabled && !isClicking && selectCard(card)}
                        >
                          <TarotCard 
                            card={card} 
                            isRevealed={false} 
                            size="small"
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
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
