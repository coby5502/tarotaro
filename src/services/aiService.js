// ============================================
// OpenAI ChatGPT 타로 해석 서비스 (Serverless Function 사용)
// ============================================

const getLanguageName = (lang) => {
  const names = { ko: 'Korean', en: 'English', ja: 'Japanese' };
  return names[lang] || 'English';
};

const getLanguageInstruction = (lang) => {
  const instructions = {
    ko: '반드시 한국어로만 답변하세요. 영어나 일본어를 절대 섞지 마세요.',
    en: 'You must respond ONLY in English. Do NOT mix any Korean or Japanese.',
    ja: '必ず日本語のみで回答してください。韓国語や英語を絶対に混ぜないでください。'
  };
  return instructions[lang] || instructions['en'];
};

const buildPrompt = (cards, spread, question, lang) => {
  const langName = getLanguageName(lang);
  const langInstruction = getLanguageInstruction(lang);
  
  const cardInfo = cards.map((card, i) => {
    const name = card.name.en || card.name.ko;
    const position = card.position?.meaning || card.position?.name || `Position ${i + 1}`;
    const direction = card.isReversed ? 'REVERSED' : 'Upright';
    const keywords = card.keywords?.join(', ') || '';
    return `${i + 1}. **${name}** (${direction}) - Position: ${position}${keywords ? ` | Keywords: ${keywords}` : ''}`;
  }).join('\n');

  const sectionTitles = {
    ko: {
      answer: '## 🎯 당신의 질문에 대한 직접적인 답변',
      cards: '## 🃏 각 카드의 의미',
      overall: '## ✨ 종합 해석',
      advice: '## 💫 실질적인 조언',
      warning: '## ⚠️ 주의할 점',
      future: '## 🔮 앞으로의 전망'
    },
    en: {
      answer: '## 🎯 Direct Answer to Your Question',
      cards: '## 🃏 Each Card\'s Meaning',
      overall: '## ✨ Overall Interpretation',
      advice: '## 💫 Practical Advice',
      warning: '## ⚠️ Points to Watch',
      future: '## 🔮 Future Outlook'
    },
    ja: {
      answer: '## 🎯 あなたの質問への直接的な答え',
      cards: '## 🃏 各カードの意味',
      overall: '## ✨ 総合解釈',
      advice: '## 💫 実践的なアドバイス',
      warning: '## ⚠️ 注意点',
      future: '## 🔮 今後の展望'
    }
  };

  const titles = sectionTitles[lang] || sectionTitles['en'];

  return `[STRICT LANGUAGE REQUIREMENT: ${langName.toUpperCase()} ONLY - ABSOLUTELY NO OTHER LANGUAGES]
${langInstruction}

You are a renowned, intuitive tarot reader with decades of experience. You speak directly, honestly, and don't sugarcoat readings. Your interpretations are insightful, specific, and actionable.

=== READING DETAILS ===
Spread Type: ${spread.name}
${question ? `
🔮 THE QUERENT'S QUESTION: "${question}"
This is the most important context. Your entire reading should revolve around answering this question directly and thoroughly.
` : 'This is a general life guidance reading.'}

=== CARDS DRAWN ===
${cardInfo}

=== YOUR TASK ===
Provide a deep, meaningful reading. Be DIRECT and HONEST - don't be vague or overly diplomatic. If the cards show challenges, say so clearly. If they show opportunities, be specific about them.

${question ? `${titles.answer}
Start by directly answering the querent's question. Don't beat around the bush. Tell them what the cards say about their specific situation. Be bold and clear.

` : ''}${titles.cards}
For EACH card:
- Explain what this card means in its specific position
- How it relates to the question/situation
- ${cards.length <= 3 ? 'Give 3-4 sentences per card' : 'Give 2-3 sentences per card'}
- If reversed, emphasize the blocked/challenged energy

${titles.overall}
Weave all the cards together into a coherent narrative. What story are they telling? What's the bigger picture? (4-5 sentences)

${titles.advice}
Give specific, actionable advice. Not generic platitudes, but real steps they can take. Be practical and direct. (3-4 bullet points)

${titles.warning}
What should they be careful about? What pitfalls might they face? Be honest about challenges. (2-3 points)

${titles.future}
Based on the cards, what's likely to unfold if they follow the guidance? Give them hope but be realistic. (2-3 sentences)

=== STYLE REQUIREMENTS ===
- Be warm but direct - like a wise friend who tells the truth
- Use vivid, descriptive language
- Be specific, not generic
- Don't be afraid to point out difficulties
- Give real, practical advice
- Make them feel understood and guided

CRITICAL: Respond ONLY in ${langName}. ANY other language will invalidate the reading!`;
};

export const generateTarotReading = async (cards, spread, question, language) => {
  const prompt = buildPrompt(cards, spread, question, language);

  const messages = [
    {
      role: 'system',
      content: `You are a master tarot reader known for insightful, honest, and transformative readings. You speak in ${getLanguageName(language)} ONLY. ${getLanguageInstruction(language)} Your readings are detailed, specific, and genuinely helpful - never vague or generic.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await fetch('/api/tarot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, language }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
