import { createContext, useContext, useEffect, type ReactNode } from "react";

// White-only theme — dark mode removed
const ThemeCtx = createContext<{ theme: "light"; toggle: () => void }>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    try { localStorage.setItem("studysphere-theme", "light"); } catch {}
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme: "light", toggle: () => {} }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
