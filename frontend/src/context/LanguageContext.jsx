import React, { createContext, useContext, useState, useEffect } from 'react';
import { DICT } from '../i18n/dict';

const LangCtx = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('fl_lang') || 'ar');

  useEffect(() => {
    localStorage.setItem('fl_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // t('النص العربي') -> الإنجليزية عند اختيار en، وإلا يرجع العربية كما هي
  const t = (ar) => (lang === 'ar' ? ar : (DICT[ar] !== undefined ? DICT[ar] : ar));
  const toggle = () => setLang(l => (l === 'ar' ? 'en' : 'ar'));

  return (
    <LangCtx.Provider value={{ lang, setLang, toggle, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LangCtx.Provider>
  );
};

export const useLang = () => useContext(LangCtx) || { lang: 'ar', t: (x) => x, dir: 'rtl', toggle: () => {}, setLang: () => {} };
