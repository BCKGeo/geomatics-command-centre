import { createContext, useContext, useState, useCallback } from "react";
import { DARK, LIGHT, getThemePref, setThemePref } from "../lib/theme.js";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getThemePref);

  const B = theme === "dark" ? DARK : LIGHT;

  const toggleTheme = useCallback(() => {
    const t = theme === "dark" ? "light" : "dark";
    setThemeState(t);
    setThemePref(t);
    document.body.style.background = t === "dark" ? DARK.bg : LIGHT.bg;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, B, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
