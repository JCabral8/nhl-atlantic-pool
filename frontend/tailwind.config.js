/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepNavy: '#001F3F',
        iceBlue: '#0099FF',
        charcoal: '#2C3E50',
        lightGray: '#F5F7FA',
        successGreen: '#22C55E',
        warningOrange: '#F97316',
        errorRed: '#DC2626',
        infoTeal: '#06B6D4',
        // Team colors
        tampaBlue: '#002855',
        tampaGold: '#FFD700',
        bruinsBlack: '#010101',
        bruinsGold: '#FFD700',
        redWingsRed: '#CE1141',
        habsRed: '#AF3236',
        habsBlue: '#00205B',
        leafsBlue: '#003DA5',
        panthersGold: '#B0975D',
        senatorsRed: '#CC0000',
        sabresNavy: '#002654',
        sabresGold: '#FFD700',
      },
    },
  },
  plugins: [],
}

