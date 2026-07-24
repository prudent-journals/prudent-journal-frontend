/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      colors: {
        // Deep academic navy
        navy: {
          50:  '#f0f3f9',
          100: '#d9e2f0',
          200: '#b3c5e1',
          300: '#8da8d2',
          400: '#678bc3',
          500: '#416eb4',
          600: '#345890',
          700: '#27426c',
          800: '#1a2c48',
          900: '#0d1624',
          950: '#060b12',
        },
        // Academic gold
        gold: {
          50:  '#fdf9ec',
          100: '#faf0ca',
          200: '#f5e090',
          300: '#f0cd55',
          400: '#e8b82a',
          500: '#c5971a',
          600: '#9e7814',
          700: '#775a0f',
          800: '#503c0a',
          900: '#281e05',
        },
        // Warm parchment background
        parchment: {
          50:  '#fdfcf8',
          100: '#faf7ee',
          200: '#f5efdc',
          300: '#ede0c0',
          400: '#e0cda0',
          500: '#d4b87e',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0d1624 0%, #1a2c48 50%, #27426c 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #c5971a, #f0cd55, #c5971a)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-right': 'slideRight 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'draw-line': 'drawLine 1.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(197, 151, 26, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(197, 151, 26, 0)' },
        },
        drawLine: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      boxShadow: {
        'card': '0 2px 20px rgba(13, 22, 36, 0.08)',
        'card-hover': '0 8px 40px rgba(13, 22, 36, 0.16)',
        'gold': '0 4px 24px rgba(197, 151, 26, 0.3)',
        'navy': '0 4px 24px rgba(13, 22, 36, 0.4)',
        'inner-gold': 'inset 0 1px 0 rgba(197, 151, 26, 0.3)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
