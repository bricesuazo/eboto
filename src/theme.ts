import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const theme = extendTheme({
  initialColorMode: "dark",
  useSystemColorMode: true,
  fonts: { body: `'Inter', sans-serif` },
} as ThemeConfig);

export default theme;
