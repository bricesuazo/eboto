module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}",],
  theme: {
    extend: {
      colors: {
        primary: "#295a29",
        secondary: "blue",
        'black-50': 'rgba(0, 0, 0, 0.50)',
      },
      backgroundImage: {
        'election-cover': "url('/src/assets/imgs/election/election-cover.jpg')",
      },
    },
  },
  plugins: [],
}
