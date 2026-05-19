/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fffaf2',
          100: '#fff3df',
          200: '#f8e6c7',
          300: '#efd4a7',
        },
        cocoa: {
          500: '#8f5f46',
          600: '#74472f',
          700: '#5a341f',
          900: '#321b11',
        },
        rosemilk: {
          100: '#ffe9ed',
          200: '#ffd5dd',
          300: '#fcb8c4',
          400: '#f48fa1',
        },
        caramel: {
          100: '#ffe8c7',
          200: '#f7c989',
          300: '#e7a85c',
        },
        mintcream: '#edf7ef',
      },
      fontFamily: {
        sans: ['Prompt', 'Noto Sans Thai', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(116, 71, 47, 0.12)',
        card: '0 14px 36px rgba(116, 71, 47, 0.10)',
        button: '0 12px 24px rgba(244, 143, 161, 0.28)',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        softPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '.72' },
          '50%': { transform: 'scale(1.04)', opacity: '1' },
        },
      },
      animation: {
        'float-in': 'floatIn .42s ease-out both',
        'soft-pulse': 'softPulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
