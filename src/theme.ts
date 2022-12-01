import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const theme = extendTheme({
  initialColorMode: "light",
  useSystemColorMode: true,
  fonts: { body: `'Inter', sans-serif` },
  colors: {
    black: "#000",
    white: "#fff",
    // generate here - https://grayscale.design/app
    gray: {
      50: "#f2f9f2",
      100: "#e5f3e5",
      200: "#cae7ca",
      300: "#a5d6a5",
      400: "#68ba68",
      500: "#459845",
      600: "#387b38",
      700: "#316b31",
      800: "#265426",
      900: "#1f451f",
    },
  },
} as ThemeConfig);

export default theme;
