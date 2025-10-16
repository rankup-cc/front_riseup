import React, { createContext, useContext, useEffect, useState } from 'react';

const PacesContext = createContext();
export const usePaces = () => useContext(PacesContext);

const STORAGE_KEY = 'riseup:paces:last';

export function PacesProvider({ children }) {
  const [paces, setPaces] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  });

  useEffect(() => {
    if (paces) localStorage.setItem(STORAGE_KEY, JSON.stringify(paces));
  }, [paces]);

  return (
    <PacesContext.Provider value={{ paces, setPaces }}>
      {children}
    </PacesContext.Provider>
  );
}
