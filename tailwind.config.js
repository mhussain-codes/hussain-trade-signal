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
        background: '#0B0F19',
        card: '#151A27',
        primary: '#EAB308',
        'primary-hover': '#CA8A04',
        accent: '#202636',
        success: '#10B981',
        danger: '#EF4444',
        text: '#F3F4F6',
        'text-muted': '#9CA3AF'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
