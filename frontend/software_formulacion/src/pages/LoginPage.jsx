import React, { useState } from 'react';
import {
    Box, Typography, TextField, Paper, Grid,
    InputAdornment, IconButton, useTheme
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useAuth } from '../context/useAuth';

// --- Iconos ---
import {
    PersonOutline, LockOutlined, Visibility, VisibilityOff,
    BiotechOutlined, Login
} from '@mui/icons-material';

import './styles/Login.css';
import logoAnimado from '../assets/GifSiaumex.gif';

function LoginPage() {
    const theme = useTheme();
    const { loginUser } = useAuth();

    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [showContraseña, setShowContraseña] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // ---------------------- LÓGICA DE LOGIN ----------------------
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            const credentials = { correo, password };
            await loginUser(credentials);
        } catch (error) {
            setErrorMessage(error.message || "Error desconocido al iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };

    const handleClickShowPassword = () => setShowContraseña(!showContraseña);
    const handleMouseDownPassword = (e) => e.preventDefault();

    return (
        // 1. EL CONTENEDOR PRINCIPAL OCUPA EL 100% DE LA ALTURA (100vh)
        <Grid container component="main" sx={{ height: '100vh', overflow: 'hidden' }}>
            
            {/* ------------------------------------------------------- */}
            {/* COLUMNA IZQUIERDA (7/12 del ancho) - BRANDING Y BURBUJAS */}
            {/* ------------------------------------------------------- */}
            <Grid
                item
                xs={false} // Se oculta en móviles
                sm={4}
                md={7}
                sx={{
                    position: 'relative',
                    backgroundImage: 'url(https://source.unsplash.com/random?science)', // Opcional: fondo imagen si falla el color
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: theme.palette.background.default, // Tu fondo base
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: { xs: 'none', sm: 'flex' }, // Flex para centrar contenido
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                {/* Capa de animación (Burbujas) */}
                <div className="login-animation-wrapper">
                    {Array.from(Array(15)).map((_, i) => (
                        <div key={i} className="bubble"></div>
                    ))}
                </div>

                {/* Contenido Texto/Icono Izquierda (Encima de las burbujas) */}
                <Box sx={{ zIndex: 2, position: 'relative', p: 4 }}>
                    <BiotechOutlined sx={{ fontSize: 80, color: '#33799CFF', mb: 2 }} />
                    
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.5px',
                            background: (theme) => theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, #FFFFFF 0%, #cfcfcf 100%)'
                                : 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: (theme) => theme.palette.mode === 'dark'
                                ? 'drop-shadow(0px 2px 4px rgba(255,255,255,0.1))'
                                : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))',
                            fontSize: { xs: '2rem', md: '3.5rem' }
                        }}
                    >
                        Software de Formulación
                    </Typography>

                    <Typography
                        variant="h5"
                        sx={{
                            mt: 2,
                            fontWeight: 600,
                            color: '#33799CFF',
                            letterSpacing: '1px'
                        }}
                    >
                        Precisión y Control.
                    </Typography>
                </Box>
            </Grid>

            {/* ------------------------------------------------------- */}
            {/* COLUMNA DERECHA (5/12 del ancho) - FORMULARIO DE ACCESO */}
            {/* ------------------------------------------------------- */}
            <Grid
                item
                xs={12}
                sm={8}
                md={5}
                component={Paper}
                elevation={6}
                square
                sx={{
                    display: 'flex',            // Flexbox para centrar
                    flexDirection: 'column',
                    alignItems: 'center',       // Centrado horizontal
                    justifyContent: 'center',   // Centrado vertical (La clave)
                    height: '100%',             // Asegura que ocupe toda la altura
                    backgroundColor: theme.palette.background.paper,
                }}
            >
                {/* CAJA CONTENEDORA DEL FORMULARIO (Limita el ancho para que no se estire feo) */}
                <Box
                    sx={{
                        my: 8,
                        mx: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '450px' // Ancho máximo del formulario
                    }}
                >
                    {/* Logo de la empresa */}
                    <Box
                        component="img"
                        src={logoAnimado}
                        alt="Logo Empresa"
                        sx={{ width: 80, height: 'auto', mb: 3 }}
                    />

                    <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Iniciar Sesión
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Ingresa tus credenciales para continuar
                    </Typography>

                    {/* Mensaje de Error */}
                    {errorMessage && (
                        <Typography color="error" variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                            {errorMessage}
                        </Typography>
                    )}

                    {/* Inputs */}
                    <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="correo"
                            label="Correo Electrónico"
                            name="correo"
                            autoComplete="email"
                            autoFocus
                            value={correo}
                            // --- CAMBIO AQUÍ: Eliminamos espacios al escribir ---
                            onChange={(e) => {
                                const valSinEspacios = e.target.value.replace(/\s/g, '');
                                setCorreo(valSinEspacios);
                            }}
                            // ----------------------------------------------------
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutline color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Contraseña"
                            type={showContraseña ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showContraseña ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <LoadingButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            loading={loading}
                            loadingPosition="start"
                            startIcon={<Login />}
                            sx={{
                                mt: 4,
                                mb: 2,
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                borderRadius: '10px',
                                textTransform: 'none',
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                '&:hover': {
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                }
                            }}
                        >
                            Acceder
                        </LoadingButton>

                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 5 }}>
                            © Implementaciones SIAUMEX {new Date().getFullYear()}
                        </Typography>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
}

export default LoginPage;