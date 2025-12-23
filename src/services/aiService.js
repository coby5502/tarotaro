// ============================================
// OpenAI ChatGPT 타로 해석 서비스
// ============================================

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const getLanguageName = (lang) => {
  const names = { ko: 'Korean', en: 'English', ja: 'Japanese' };
  return names[lang] || 'English';
};

const getLanguageInstruction = (lang) => {
  const instructions = {
    ko: '반드시 한국어로만 답변하세요. 영어나 일본어를 섞지 마세요.',
    en: 'You must respond only in English. Do not mix Korean or Japanese.',
    ja: '必ず日本語のみで回答してください。韓国語や英語を混ぜないでください。'
  };
  return instructions[lang] || instructions['en'];
};

const buildPrompt = (cards, spread, question, lang) => {
  const langName = getLanguageName(lang);
  const langInstruction = getLanguageInstruction(lang);
  
  const cardInfo = cards.map((card, i) => {
    const name = card.name.en || card.name.ko;
    const position = card.position?.meaning || card.position?.name || `Position ${i + 1}`;
    const direction = card.isReversed ? 'Reversed' : 'Upright';
    return `${i + 1}. ${name} (${direction}) - ${position}`;
  }).join('\n');

  const sectionTitles = {
    ko: {
      answer: '## 🎯 질문에 대한 답',
      cards: '## 🃏 카드 해석',
      overall: '## ✨ 종합 메시지',
      advice: '## 💫 조언'
    },
    en: {
      answer: '## 🎯 Answer to Your Question',
      cards: '## 🃏 Card Interpretation',
      overall: '## ✨ Overall Message',
      advice: '## 💫 Advice'
    },
    ja: {
      answer: '## 🎯 質問への答え',
      cards: '## 🃏 カード解釈',
      overall: '## ✨ 総合メッセージ',
      advice: '## 💫 アドバイス'
    }
  };

  const titles = sectionTitles[lang] || sectionTitles['en'];

  return `[LANGUAGE: ${langName.toUpperCase()} ONLY]
${langInstruction}

You are a professional tarot reader. Interpret the following tarot reading.

Spread: ${spread.name}
${question ? `Question: ${question}` : 'General reading'}

Cards drawn:
${cardInfo}

Please provide a warm, insightful reading using these sections:

${question ? `${titles.answer}
(Directly answer the question based on the cards)

` : ''}${titles.cards}
(Brief interpretation of each card in its position)

${titles.overall}
(The main message from all cards combined - 2-3 sentences)

${titles.advice}
(Practical guidance - 1-2 sentences)

IMPORTANT: Respond ONLY in ${langName}. Do NOT mix other languages!`;
};

export const generateTarotReading = async (cards, spread, question, language) => {
  if (!OPENAI_API_KEY) {
    throw new Error('API key not configured');
  }

  const prompt = buildPrompt(cards, spread, question, language);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a mystical tarot reader. Always respond in ${getLanguageName(language)} only. ${getLanguageInstruction(language)}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
};

