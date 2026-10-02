/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdfbf7',
          100: '#f7f4ec',
          200: '#eee8d7',
          300: '#e1d5ba',
          400: '#d0bd97',
          500: '#be9f70',
          800: '#463824',
          900: '#2d2417',
        },
        sacred: {
          50: '#faf7f2',
          100: '#f3ece2',
          500: '#b8860b', // dark goldenrod
          600: '#996f08',
          700: '#7a5806',
        },
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
