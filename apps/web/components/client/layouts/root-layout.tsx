"use client";

import { toggleTheme } from "@/actions";
import { CacheProvider } from "@emotion/react";
import {
  useEmotionCache,
  MantineProvider,
  ColorSchemeProvider,
  type ColorScheme,
} from "@mantine/core";
import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";

export default function RootLayoutClient({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: ColorScheme;
}) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(theme);

  const cache = useEmotionCache();
  cache.compat = true;
  useServerInsertedHTML(() => (
    <style
      data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
      dangerouslySetInnerHTML={{
        __html: Object.values(cache.inserted).join(" "),
      }}
    />
  ));
  return (
    <CacheProvider value={cache}>
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={() => {
          toggleTheme();
          setColorScheme((c) => (c === "dark" ? "light" : "dark"));
        }}
      >
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
            fontFamily: "Poppins, sans-serif",
            colorScheme,
            primaryColor: "green",
          }}
        >
          {children}
        </MantineProvider>
      </ColorSchemeProvider>
    </CacheProvider>
  );
}
