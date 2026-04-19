/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#1D4ED8', light: '#3B82F6', dark: '#1E40AF' },
        success:  { DEFAULT: '#059669', light: '#10B981' },
        warning:  { DEFAULT: '#D97706', light: '#F59E0B' },
        danger:   { DEFAULT: '#DC2626', light: '#EF4444' },
        info:     { DEFAULT: '#0EA5E9', light: '#38BDF8' },
        sidebar:  { DEFAULT: '#0F172A', text: '#CBD5E1' },
        surface:  { DEFAULT: '#FFFFFF', bg: '#F1F5F9', border: '#E2E8F0' },
        tx:       { main: '#1E293B', muted: '#64748B' },
      },
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
