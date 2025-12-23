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

// 언어별 시스템 프롬프트
const getSystemPrompt = (language) => {
  const prompts = {
    ko: '당신은 전문 타로 리더입니다. 깊이 있고 통찰력 있는 타로 해석을 제공합니다. 응답은 항상 한국어로 합니다. 따뜻하고 공감적인 어조로 답변해주세요.',
    en: 'You are a professional tarot reader. Provide deep and insightful tarot interpretations. Always respond in English. Use a warm and empathetic tone.',
    ja: 'あなたはプロのタロットリーダーです。深く洞察力のあるタロット解釈を提供します。常に日本語で応答してください。温かく共感的なトーンで答えてください。'
  };
  return prompts[language] || prompts['en'];
};

// 언어별 프롬프트 템플릿
const getPromptTemplate = (language) => {
  const templates = {
    ko: {
      intro: '다음 타로 리딩을 해석해주세요.',
      spreadLabel: '스프레드',
      questionLabel: '질문',
      noQuestion: '일반적인 운세',
      cardLabel: '번째 카드',
      positionLabel: '위치',
      directionUpright: '정방향',
      directionReversed: '역방향',
      keywordsLabel: '키워드',
      basicMeaningLabel: '기본 의미',
      instructions: `
위 카드들을 바탕으로 종합적인 타로 리딩을 제공해주세요.

다음 형식으로 답변해주세요:

## 🔮 종합 해석
모든 카드를 종합하여 전체적인 메시지를 해석해주세요.

## 🃏 각 카드의 메시지
각 카드가 주는 구체적인 메시지와 조언을 위치와 함께 설명해주세요.

## 💫 조언
질문자에게 실질적이고 따뜻한 조언을 제공해주세요.

## ✨ 핵심 메시지
한 줄로 정리된 핵심 메시지를 제공해주세요.

너무 길지 않게 핵심적인 내용을 담아주세요.`
    },
    en: {
      intro: 'Please interpret the following tarot reading.',
      spreadLabel: 'Spread',
      questionLabel: 'Question',
      noQuestion: 'General fortune',
      cardLabel: 'Card',
      positionLabel: 'Position',
      directionUpright: 'Upright',
      directionReversed: 'Reversed',
      keywordsLabel: 'Keywords',
      basicMeaningLabel: 'Basic meaning',
      instructions: `
Based on the cards above, please provide a comprehensive tarot reading.

Please respond in this format:

## 🔮 Overall Interpretation
Interpret the overall message by synthesizing all cards.

## 🃏 Message from Each Card
Explain the specific message and advice from each card along with its position.

## 💫 Advice
Provide practical and warm advice to the querent.

## ✨ Key Message
Provide a one-line summary of the key message.

Please keep it concise and focused on the essentials.`
    },
    ja: {
      intro: '以下のタロットリーディングを解釈してください。',
      spreadLabel: 'スプレッド',
      questionLabel: '質問',
      noQuestion: '一般的な運勢',
      cardLabel: '枚目のカード',
      positionLabel: '位置',
      directionUpright: '正位置',
      directionReversed: '逆位置',
      keywordsLabel: 'キーワード',
      basicMeaningLabel: '基本的な意味',
      instructions: `
上記のカードに基づいて、総合的なタロットリーディングを提供してください。

以下の形式で回答してください：

## 🔮 総合解釈
すべてのカードを総合して、全体的なメッセージを解釈してください。

## 🃏 各カードからのメッセージ
各カードが与える具体的なメッセージとアドバイスを位置と共に説明してください。

## 💫 アドバイス
質問者に実践的で温かいアドバイスを提供してください。

## ✨ 核心メッセージ
一行でまとめた核心メッセージを提供してください。

長すぎず、核心的な内容を含めてください。`
    }
  };
  return templates[language] || templates['en'];
};

// 타로 해석 프롬프트 생성
const buildTarotPrompt = (cards, spread, question, language) => {
  const template = getPromptTemplate(language);
  
  const cardDescriptions = cards.map((card, index) => {
    const direction = card.isReversed ? template.directionReversed : template.directionUpright;
    const keywords = card.isReversed ? card.keywords.reversed : card.keywords.upright;
    const meaning = card.isReversed ? card.meaning.reversed : card.meaning.upright;
    
    return `
### ${index + 1}${template.cardLabel}: ${card.position.name}
- **${template.positionLabel}**: ${card.position.description}
- **카드/Card**: ${card.name.ko} (${card.name.en}) - ${direction}
- **${template.keywordsLabel}**: ${keywords.join(', ')}
- **${template.basicMeaningLabel}**: ${meaning}
`;
  }).join('\n');

  return `${template.intro}

## ${template.spreadLabel}: ${spread.name}
## ${template.questionLabel}: ${question || template.noQuestion}

---

${cardDescriptions}

---

${template.instructions}`;
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
        temperature: 0.7,
        max_tokens: 2500
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
