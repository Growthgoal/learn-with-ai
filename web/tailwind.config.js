/** GrowthGoal's palette and faces, so Learn with AI reads as part of the same shop. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#233306', soft: '#4B5B27', faint: '#7A8A57' },
        cream: { DEFAULT: '#FBFAF3', dim: '#F1F4E6' },
        lime: { 50: '#F7FEE7', 100: '#ECFCCB', 200: '#D9F99D', 400: '#A3E635', 500: '#84CC16', 600: '#65A30D', 700: '#4D7C0F', 800: '#3F6212' },
        sun: { 100: '#FEF9C3', 200: '#FEF08A', 300: '#FDE68A', 400: '#FACC15', 500: '#EAB308', 600: '#CA8A04', 700: '#A16207' },
      },
      fontFamily: { display: ['"Baloo 2"', 'cursive'], body: ['Quicksand', 'Mukta', 'sans-serif'] },
      boxShadow: { card: '0 8px 24px -8px rgba(35,51,6,0.18)', 'card-lg': '0 16px 40px -12px rgba(35,51,6,0.22)' },
      borderRadius: { '4xl': '2rem' },
    },
  },
}
