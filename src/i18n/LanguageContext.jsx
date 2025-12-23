// ============================================
// 언어 컨텍스트
// ============================================

import { createContext, useContext, useState, useEffect } from 'react';
import { translations, getSavedLanguage, saveLanguage } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getSavedLanguage());

  useEffect(() => {
    saveLanguage(language);
    // HTML lang 속성 업데이트 (폰트 적용을 위해)
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const changeLanguage = (lang) => {
    if (['ko', 'en', 'ja'].includes(lang)) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
