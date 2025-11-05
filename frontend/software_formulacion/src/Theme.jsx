import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#263238', // Azul grisáceo muy oscuro, casi negro. Elegante y serio.
        },
        secondary: {
            main: '#00bcd4', // Azul cian para un acento moderno (quizás para links o botones sutiles).
        },
        background: {
            default: '#eceff1', // Gris claro para el fondo, que no sea blanco puro.
            paper: '#ffffff',   // Blanco para las superficies de los componentes (tarjetas, formularios).
        },
        text: {
            primary: '#263238', // Texto oscuro para buena legibilidad.
            secondary: '#607d8b', // Texto más claro para subtítulos o detalles.
        },
    },
    typography: {
        fontFamily: [
            'Roboto', // Fuente por defecto de MUI, limpia y profesional.
            'sans-serif',
        ].join(','),
        h5: {
            fontWeight: 500, // Un poco más de peso para los títulos.
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8, // Bordes un poco más redondeados para un toque moderno.
                    textTransform: 'none', // Evitar mayúsculas automáticas.
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
    },
});

export default theme;