/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0E11',
        card: '#181A20',
        'card-hover': '#1E2128',
        border: '#2B2F36',
        'emerald-accent': '#00D4A8',
        'crimson-accent': '#FF4D6A',
        'blue-accent': '#3B82F6',
        'text-primary': '#EAECEF',
        'text-secondary': '#848E9C',
        'text-muted': '#474D57',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
