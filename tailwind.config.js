/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        domain: {
          technique: '#3B82F6',
          ethique: '#EF4444',
          usage_professionnel: '#10B981',
          recherche: '#8B5CF6',
          philosophie: '#F59E0B',
          frugalite: '#6B7280'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [],
}