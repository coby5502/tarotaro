// ============================================
// Groq API Service
// LLM 기반 타로 해석 서비스 (다국어 지원)
// ============================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// 환경변수에서 API 키 가져오기
const getApiKey = () => {
  return import.meta.env.VITE_GROQ_API_KEY || '';
};

// 언어별 시스템 프롬프트 (더 강력한 언어 지시)
const getSystemPrompt = (language) => {
  const prompts = {
    ko: `당신은 20년 경력의 전문 타로 마스터입니다. 신비롭고 깊이 있는 타로 해석을 제공합니다.

**중요**: 
- 반드시 한국어로만 응답하세요. 영어나 다른 언어를 절대 섞지 마세요.
- 모든 카드 이름, 설명, 조언을 한국어로 작성하세요.
- 따뜻하고 공감적이면서도 신비로운 어조를 유지하세요.
- 타로의 상징과 의미를 깊이 있게 해석하세요.`,

    en: `You are a professional tarot master with 20 years of experience. You provide mystical and profound tarot interpretations.

**IMPORTANT**: 
- You MUST respond ONLY in English. Do NOT mix Korean, Japanese, or any other language.
- Write all card names, descriptions, and advice in English only.
- Maintain a warm, empathetic, yet mystical tone.
- Interpret the symbolism and meaning of tarot deeply.`,

    ja: `あなたは20年の経験を持つプロのタロットマスターです。神秘的で深いタロット解釈を提供します。

**重要**: 
- 必ず日本語のみで応答してください。英語や韓国語を絶対に混ぜないでください。
- すべてのカード名、説明、アドバイスを日本語で書いてください。
- 温かく共感的でありながら、神秘的なトーンを維持してください。
- タロットの象徴と意味を深く解釈してください。`
  };
  return prompts[language] || prompts['en'];
};

// 언어별 프롬프트 템플릿
const getPromptTemplate = (language) => {
  const templates = {
    ko: {
      intro: '아래의 타로 카드들을 해석해주세요.',
      spreadLabel: '스프레드',
      questionLabel: '질문',
      noQuestion: '오늘의 운세와 메시지',
      cardLabel: '번째 카드',
      positionLabel: '위치 의미',
      directionUpright: '정방향',
      directionReversed: '역방향',
      keywordsLabel: '키워드',
      basicMeaningLabel: '기본 의미',
      instructions: `위 카드들을 바탕으로 풍성하고 깊이 있는 타로 리딩을 제공해주세요.

반드시 아래 형식으로 한국어로만 답변하세요:

## 🔮 전체 운세 해석
카드들이 전하는 전체적인 흐름과 에너지를 읽어주세요. 질문자의 현재 상황과 연결하여 해석해주세요.

## 🃏 카드별 상세 메시지
각 카드가 해당 위치에서 전하는 구체적인 메시지를 설명해주세요. 카드의 상징, 이미지, 숫자의 의미도 포함해주세요.

## 🌟 숨겨진 연결고리
카드들 사이의 연결점과 패턴을 발견하여 더 깊은 통찰을 제공해주세요.

## 💫 실천 조언
질문자가 실제로 행동으로 옮길 수 있는 구체적이고 따뜻한 조언을 제공해주세요.

## ✨ 오늘의 핵심 메시지
카드들이 전하는 가장 중요한 메시지를 한두 문장으로 압축해주세요.

풍성하되 핵심을 담아주세요.`
    },
    en: {
      intro: 'Please interpret the following tarot cards.',
      spreadLabel: 'Spread',
      questionLabel: 'Question',
      noQuestion: "Today's fortune and message",
      cardLabel: 'Card',
      positionLabel: 'Position meaning',
      directionUpright: 'Upright',
      directionReversed: 'Reversed',
      keywordsLabel: 'Keywords',
      basicMeaningLabel: 'Basic meaning',
      instructions: `Based on the cards above, please provide a rich and profound tarot reading.

You MUST respond ONLY in English using this format:

## 🔮 Overall Reading
Interpret the overall flow and energy the cards convey. Connect it to the querent's current situation.

## 🃏 Detailed Message for Each Card
Explain the specific message each card conveys in its position. Include the symbolism, imagery, and numerological meaning.

## 🌟 Hidden Connections
Discover connections and patterns between the cards to provide deeper insight.

## 💫 Practical Advice
Provide specific, warm advice that the querent can actually put into action.

## ✨ Key Message of the Day
Summarize the most important message from the cards in one or two sentences.

Be thorough yet focused on the essentials.`
    },
    ja: {
      intro: '以下のタロットカードを解釈してください。',
      spreadLabel: 'スプレッド',
      questionLabel: '質問',
      noQuestion: '今日の運勢とメッセージ',
      cardLabel: '枚目のカード',
      positionLabel: '位置の意味',
      directionUpright: '正位置',
      directionReversed: '逆位置',
      keywordsLabel: 'キーワード',
      basicMeaningLabel: '基本的な意味',
      instructions: `上記のカードに基づいて、豊かで深いタロットリーディングを提供してください。

必ず日本語のみで以下の形式で回答してください：

## 🔮 総合運勢解釈
カードが伝える全体的な流れとエネルギーを読み取ってください。質問者の現在の状況と結びつけて解釈してください。

## 🃏 各カードの詳細メッセージ
各カードがその位置で伝える具体的なメッセージを説明してください。カードの象徴、イメージ、数字の意味も含めてください。

## 🌟 隠された繋がり
カード間の繋がりとパターンを発見し、より深い洞察を提供してください。

## 💫 実践的アドバイス
質問者が実際に行動に移せる具体的で温かいアドバイスを提供してください。

## ✨ 今日の核心メッセージ
カードが伝える最も重要なメッセージを一、二文でまとめてください。

豊かでありながら核心を捉えてください。`
    }
  };
  return templates[language] || templates['en'];
};

// 타로 해석 프롬프트 생성
const buildTarotPrompt = (cards, spread, question, language) => {
  const template = getPromptTemplate(language);
  
  // 언어별 카드 이름 사용
  const getCardName = (card, lang) => {
    if (lang === 'ko') return card.name.ko;
    if (lang === 'ja') return card.name.ja || card.name.en;
    return card.name.en;
  };

  const cardDescriptions = cards.map((card, index) => {
    const direction = card.isReversed ? template.directionReversed : template.directionUpright;
    const keywords = card.isReversed ? card.keywords.reversed : card.keywords.upright;
    const meaning = card.isReversed ? card.meaning.reversed : card.meaning.upright;
    const cardName = getCardName(card, language);
    
    return `
### ${index + 1}${template.cardLabel}: ${card.position.name}
- **${template.positionLabel}**: ${card.position.description}
- **카드**: ${cardName} (${direction})
- **${template.keywordsLabel}**: ${keywords.join(', ')}
- **${template.basicMeaningLabel}**: ${meaning}
`;
  }).join('\n');

  const langReminder = {
    ko: '\n\n⚠️ 반드시 한국어로만 답변하세요!',
    en: '\n\n⚠️ You MUST respond in English ONLY!',
    ja: '\n\n⚠️ 必ず日本語のみで答えてください！'
  };

  return `${template.intro}

## ${template.spreadLabel}: ${spread.name}
## ${template.questionLabel}: ${question || template.noQuestion}

---

${cardDescriptions}

---

${template.instructions}${langReminder[language] || langReminder['en']}`;
};

// Groq API 호출
export const generateTarotReading = async (cards, spread, question, language = 'ko') => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const prompt = buildTarotPrompt(cards, spread, question, language);
  const systemPrompt = getSystemPrompt(language);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.75,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Failed to generate interpretation.';
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};
