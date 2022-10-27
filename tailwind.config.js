module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}",],
/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#295a29",
        secondary: "blue",
      },
      backgroundImage: {
        'election-cover': "url('/src/assets/imgs/election/election-cover.jpg')",
        "dashboard-stats-voted": "#91EC71",
        "black-50": "rgba(0, 0, 0, 0.50)",
        yellow: "#DEAC45",
      },
      backgroundImage: {
        "eboto-mo-logo": "url('/assets/images/eboto-mo-logo.png')",
        vote1: "url('/assets/images/vote1.png')",
        vote2: "url('/assets/images/vote2.png')",
        vote3: "url('/assets/images/vote3.png')",
        "election-cover": "url('/assets/images/election/election-cover.jpg')",
        "cvsu-landing-page": "url('/assets/images/cvsu-front-scaled.jpg')",
      },
    },
  plugins: [],
}
};
