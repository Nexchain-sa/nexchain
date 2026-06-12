/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#4F46E5', light: '#6366F1', dark: '#4338CA', 50:'#EEF2FF', 100:'#E0E7FF', 900:'#312E81', 950:'#1E1B4B' },
        accent:   { DEFAULT: '#0D9488', light: '#14B8A6', 50:'#F0FDFA', 100:'#CCFBF1', 700:'#0F766E' },
        success:  { DEFAULT: '#059669', light: '#10B981' },
        warning:  { DEFAULT: '#D97706', light: '#F59E0B' },
        danger:   { DEFAULT: '#DC2626', light: '#EF4444' },
        info:     { DEFAULT: '#0EA5E9', light: '#38BDF8' },
        sidebar:  { DEFAULT: '#1E1B4B', alt: '#312E81', text: '#C7CBE8' },
        surface:  { DEFAULT: '#FFFFFF', bg: '#F4F6FB', border: '#E5E7EF' },
        tx:       { main: '#1E293B', muted: '#64748B' },
      },
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
