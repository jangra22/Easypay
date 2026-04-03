/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f35919',
          50: '#fff6f3',
          100: '#ffede7',
          200: '#ffdad0',
          300: '#ffbcad',
          400: '#ff9279',
          500: '#f35919',
          600: '#df4208',
          700: '#ba3006',
          800: '#94260b',
          900: '#77220e',
        },
        success: {
          DEFAULT: '#10b981',
          bg: '#e6f8f0', // Light green background for badges
        },
        danger: {
          DEFAULT: '#ef4444',
          bg: '#fef2f2', // Light red background for badges
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg: '#fffbeb', // Light yellow/orange background for badges
        },
        gray: {
          bg: '#f9fafb', // Off-white app background
          card: '#ffffff', // Card background
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
