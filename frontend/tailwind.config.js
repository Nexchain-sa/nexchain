/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // AI-Inspired Palette
        ai: {
          violet:  '#6C63FF',   // الذكاء والإبداع
          cyan:    '#00F5FF',   // مستقبلي وتقني
          magenta: '#FF6BFF',   // طاقة وابتكار
          emerald: '#00E5A0',   // نمو وأمان
          gold:    '#FFB800',   // قيمة وأهمية
        },
        bg: {
          deep:  '#07080F',     // خلفية رئيسية
          card:  '#0E0F1E',     // بطاقات
          card2: '#13142A',     // بطاقات ثانوية
        },
        // Legacy support
        navy:    { DEFAULT: '#0E0F1E', light: '#13142A', dark: '#07080F' },
        cyan:    { DEFAULT: '#00F5FF', light: '#33F8FF', dark: '#00B8CC' },
        purple:  { DEFAULT: '#6C63FF', light: '#9B94FF', dark: '#4A43CC' },
        nxgreen: { DEFAULT: '#00E5A0', light: '#33EBB5', dark: '#00A873' },
      },
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
      },
      backgroundImage: {
        'ai-gradient':  'linear-gradient(135deg, #6C63FF, #00F5FF)',
        'ai-gradient2': 'linear-gradient(135deg, #FF6BFF, #6C63FF)',
        'ai-gradient3': 'linear-gradient(135deg, #00E5A0, #00F5FF)',
      },
      boxShadow: {
        'ai-violet':  '0 0 20px #6C63FF33',
        'ai-cyan':    '0 0 20px #00F5FF33',
        'ai-magenta': '0 0 20px #FF6BFF33',
        'ai-emerald': '0 0 20px #00E5A033',
      },
    },
  },
  plugins: [],
};
