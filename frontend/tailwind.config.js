/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#0D1B5E', light: '#1A2F8A', dark: '#0A0F2E' },
        cyan:   { DEFAULT: '#00D4FF', light: '#33DDFF', dark: '#0097B2' },
        purple: { DEFAULT: '#7B2FFF', light: '#9B5FFF', dark: '#5A1FCC' },
        nxgreen:{ DEFAULT: '#00C853', light: '#00E676', dark: '#00952F' },
      },
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
