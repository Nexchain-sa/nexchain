import React, { createContext, useContext, useState, useEffect } from 'react';

const CurCtx = createContext(null);

// أسعار صرف ثابتة من الريال السعودي (قابلة لاحقًا للربط بمصدر حيّ)
const RATES = { SAR: 1, USD: 1 / 3.75, EUR: 1 / 4.10, AED: 1 / 1.02 };

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => localStorage.getItem('fl_currency') || 'SAR');
  useEffect(() => { localStorage.setItem('fl_currency', currency); }, [currency]);

  // fmt(amountInSAR) -> النص بالعملة المختارة
  const fmt = (sar) => {
    const v = Number(sar || 0) * (RATES[currency] || 1);
    return `${v.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${currency}`;
  };

  return (
    <CurCtx.Provider value={{ currency, setCurrency, fmt, currencies: Object.keys(RATES) }}>
      {children}
    </CurCtx.Provider>
  );
};

export const useCurrency = () => useContext(CurCtx) || {
  currency: 'SAR', setCurrency: () => {},
  fmt: (v) => `${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} SAR`,
  currencies: ['SAR'],
};
