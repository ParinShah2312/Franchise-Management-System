/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#2563EB',
        'primary-hover': '#1D4ED8',
        background: '#F3F4F6',
        border: '#E5E7EB',
      },
    },
  },
  plugins: [],
}
