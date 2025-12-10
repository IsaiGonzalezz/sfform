import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' });

// eslint-disable-next-line react-refresh/only-export-components
export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }) => {

  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode); 
          return newMode;
        });
      },
      mode, 
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // TEMA CLARO
                background: { default: '#f4f6f8', paper: '#ffffff' },
                text: { primary: '#000000' }
              }
            : {
                // TEMA OSCURO
                background: { default: '#121212', paper: '#1e1e1e' },
                text: { primary: '#ffffff' }
              }),
        },
      }),
    [mode],
  );

  // Sincronizar con variables CSS globales
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.style.setProperty('--bg-color', '#121212');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--card-bg', '#1e1e1e');
      root.style.setProperty('--border-color', '#333333');
    } else {
      root.style.setProperty('--bg-color', '#f4f6f8');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--border-color', '#e0e0e0');
    }
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};