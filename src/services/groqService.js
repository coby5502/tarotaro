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
    ko: `[LANGUAGE: KOREAN ONLY]
당신은 20년 경력의 전문 타로 마스터입니다.

## 절대 규칙
1. 오직 한국어로만 응답하세요
2. 영어, 일본어, 기타 언어를 절대 사용하지 마세요
3. 카드 이름도 한국어로 번역해서 사용하세요 (예: The Fool → 바보, The Magician → 마법사)
4. 모든 텍스트는 100% 한국어여야 합니다

따뜻하고 신비로운 타로 해석을 제공하세요.`,

    en: `[LANGUAGE: ENGLISH ONLY]
You are a professional tarot master with 20 years of experience.

## ABSOLUTE RULES
1. Respond ONLY in English
2. Do NOT use Korean, Japanese, or any other language
3. Translate all card names to English (e.g., 바보 → The Fool)
4. ALL text must be 100% in English

Provide warm and mystical tarot interpretations.`,

    ja: `[LANGUAGE: JAPANESE ONLY]
あなたは20年の経験を持つプロのタロットマスターです。

## 絶対ルール
1. 日本語のみで応答してください
2. 韓国語、英語、その他の言語は絶対に使用しないでください
3. カード名も日本語に翻訳して使用してください（例: The Fool → 愚者）
4. すべてのテキストは100%日本語でなければなりません

温かく神秘的なタロット解釈を提供してください。`
  };
  return prompts[language] || prompts['en'];
};

// 언어별 출력 포맷
const getOutputFormat = (language, hasQuestion) => {
  const formats = {
    ko: hasQuestion ? `## 🎯 질문에 대한 답변
(질문에 대해 카드가 말하는 직접적인 답변과 통찰)

## 🔮 전체 운세 해석
(카드들이 전하는 전체적인 흐름과 에너지)

## 🃏 카드별 상세 메시지
(각 카드가 해당 위치에서 전하는 메시지)

## 💫 실천 조언
(질문과 관련하여 실제로 행동할 수 있는 구체적인 조언)

## ✨ 핵심 메시지
(한두 문장으로 압축)` : `## 🔮 오늘의 운세
(카드들이 전하는 전체적인 흐름과 에너지)

## 🃏 카드별 상세 메시지
(각 카드가 해당 위치에서 전하는 메시지)

## 💫 실천 조언
(오늘 하루를 위한 구체적인 조언)

## ✨ 핵심 메시지
(한두 문장으로 압축)`,

    en: hasQuestion ? `## 🎯 Answer to Your Question
(Direct answer and insights from the cards regarding your question)

## 🔮 Overall Reading
(The overall flow and energy conveyed by the cards)

## 🃏 Detailed Message for Each Card
(Message each card conveys in its position)

## 💫 Practical Advice
(Specific actionable advice related to your question)

## ✨ Key Message
(Summarized in one or two sentences)` : `## 🔮 Today's Fortune
(The overall flow and energy conveyed by the cards)

## 🃏 Detailed Message for Each Card
(Message each card conveys in its position)

## 💫 Practical Advice
(Specific advice for your day)

## ✨ Key Message
(Summarized in one or two sentences)`,

    ja: hasQuestion ? `## 🎯 質問への答え
(質問に対するカードからの直接的な答えと洞察)

## 🔮 総合運勢解釈
(カードが伝える全体的な流れとエネルギー)

## 🃏 各カードの詳細メッセージ
(各カードがその位置で伝えるメッセージ)

## 💫 実践的アドバイス
(質問に関連した具体的な行動アドバイス)

## ✨ 核心メッセージ
(一、二文でまとめ)` : `## 🔮 今日の運勢
(カードが伝える全体的な流れとエネルギー)

## 🃏 各カードの詳細メッセージ
(各カードがその位置で伝えるメッセージ)

## 💫 実践的アドバイス
(今日一日のための具体的なアドバイス)

## ✨ 核心メッセージ
(一、二文でまとめ)`
  };
  return formats[language] || formats['en'];
};

// 타로 해석 프롬프트 생성 (언어 중립적 데이터 전달)
const buildTarotPrompt = (cards, spread, question, language) => {
  const hasQuestion = question && question.trim().length > 0;
  
  // 카드 정보를 간단하게 전달 (AI가 해당 언어로 번역)
  const cardInfo = cards.map((card, index) => {
    const direction = card.isReversed ? 'REVERSED' : 'UPRIGHT';
    const keywords = card.isReversed ? card.keywords.reversed : card.keywords.upright;
    
    return `Card ${index + 1}: ${card.name.en} (${direction})
Position: ${card.position.name}
Position meaning: ${card.position.description}
Keywords: ${keywords.join(', ')}`;
  }).join('\n\n');

  const outputFormat = getOutputFormat(language, hasQuestion);
  
  const questionEmphasis = {
    ko: hasQuestion 
      ? `\n\n⭐ 중요: 질문자의 질문 "${question}"에 대해 카드가 말하는 답을 반드시 첫 번째 섹션에서 직접적으로 답변하세요!` 
      : '',
    en: hasQuestion 
      ? `\n\n⭐ IMPORTANT: You MUST directly answer the querent's question "${question}" in the first section!` 
      : '',
    ja: hasQuestion 
      ? `\n\n⭐ 重要: 質問者の質問「${question}」に対して、最初のセクションで必ず直接答えてください！` 
      : ''
  };
  
  const langInstruction = {
    ko: `[한국어로만 답변하세요. 영어 금지!]

질문: ${question || '없음 (오늘의 운세)'}
스프레드: ${spread.name}

카드 정보:
${cardInfo}

위 정보를 바탕으로 타로 해석을 한국어로 작성하세요.
카드 이름은 한국어로 번역하세요 (예: The Fool = 바보).${questionEmphasis.ko}

출력 형식:
${outputFormat}`,

    en: `[Respond in English ONLY. No Korean!]

Question: ${question || "None (Today's fortune)"}
Spread: ${spread.name}

Card Information:
${cardInfo}

Based on the above, write a tarot interpretation in English.${questionEmphasis.en}

Output format:
${outputFormat}`,

    ja: `[日本語のみで答えてください。韓国語・英語禁止！]

質問: ${question || 'なし（今日の運勢）'}
スプレッド: ${spread.name}

カード情報:
${cardInfo}

上記の情報に基づいて、タロット解釈を日本語で書いてください。
カード名は日本語に翻訳してください（例: The Fool = 愚者）。${questionEmphasis.ja}

出力形式:
${outputFormat}`
  };

  return langInstruction[language] || langInstruction['en'];
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
