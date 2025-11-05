import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css'; // Tu index.css

// --- 1. IMPORTA ESTO DE MUI ---
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// --- 2. DEFINE TU TEMA OSCURO ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212', // <-- Este será el color del <body> (adiós blanco)
      paper: '#1e1e1e',   // <-- Este será el color de tu sidebar y appbar
    }
  },
  typography: {
    // Le dice a MUI que use la fuente de tu index.css
    fontFamily: [
      'Poppins',
      'Roboto',
      'sans-serif'
    ].join(','),
  },
});


// --- 3. ENVUELVE TU APP ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Aquí empieza la magia */}
    <ThemeProvider theme={darkTheme}>
      {/* CssBaseline aplica el 'palette.background.default' ('#121212') al <body> */}
      <CssBaseline />
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </ThemeProvider>
    {/* Aquí termina */}
  </React.StrictMode>,
);