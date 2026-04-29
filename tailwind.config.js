/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#1c2143',
          50: '#f4f5fb',
          100: '#e8eaf5',
          200: '#c8d1e6',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#252b5a',
          800: '#1c2143',
          900: '#11142a',
        },
        gold: {
          DEFAULT: '#c9a84c',
          50: '#fdf9ee',
          100: '#faf0d2',
          200: '#f3dfa0',
          300: '#e8c66a',
          400: '#dab347',
          500: '#c9a84c',
          600: '#a8862e',
          700: '#876928',
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.25s ease-out',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 8px 22px rgba(28,33,67,0.18)' },
          '50%': { boxShadow: '0 12px 32px rgba(201,168,76,0.28)' },
        },
      },
    },
  },
  plugins: [],
};