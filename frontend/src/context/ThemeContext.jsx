import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('glorita_tema') || 'claro');

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem('glorita_tema', tema);
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((prev) => (prev === 'claro' ? 'oscuro' : 'claro'));
  }, []);

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema() {
  return useContext(ThemeContext);
}
