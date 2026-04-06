import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B1B1B',
        'primary-light': '#2D2D2D',
        'primary-dark': '#0A0A0A',
        gold: '#C8A96E',
        'gold-light': '#D4B87A',
        'gold-dark': '#A88B52',
        'gold-muted': '#E8DCC8',
        cream: '#FAF8F5',
        'cream-dark': '#F0EBE3',
        'surface-bg': '#FAF8F5',
        'surface-card': '#FFFFFF',
        'border-subtle': '#E8E2D9',
        'text-secondary': '#6B6560',
        'text-muted': '#9C9590',
        'accent-green': '#16A34A',
        'accent-green-light': '#DCFCE7',
        'accent-red': '#DC2626',
        'accent-red-light': '#FEE2E2',
        'accent-amber': '#D97706',
        'accent-amber-light': '#FEF3C7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card-hover': '0 12px 40px rgba(200, 169, 110, 0.12)',
        'card-base': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.2)',
        'button-glow': '0 4px 20px rgba(200, 169, 110, 0.3)',
        'gold-glow': '0 0 30px rgba(200, 169, 110, 0.15)',
        'luxury': '0 4px 30px rgba(27, 27, 27, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'shimmer-gold': 'shimmerGold 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        bounceGentle: {
          '0%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-6px)' },
          '70%': { transform: 'translateY(-3px)' },
          '100%': { transform: 'translateY(0)' },
        },
        shimmerGold: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'luxury': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
export default config
