import React, { useState } from 'react';
import {
    Box, Typography, TextField, Paper, Grid,
    InputAdornment, IconButton, useTheme
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useAuth } from '../context/UseAuth'; 

// --- Iconos ---
import {
    PersonOutline, LockOutlined, Visibility, VisibilityOff,
    ScienceOutlined, Login, BiotechOutlined
} from '@mui/icons-material';

import './styles/Login.css';

function LoginPage() {
    const theme = useTheme(); 

    // Accede a la función de login del contexto
    const { loginUser } = useAuth(); 

    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [showContraseña, setShowContraseña] = useState(false);
    const [loading, setLoading] = useState(false); 
    const [errorMessage, setErrorMessage] = useState(''); // Estado para manejar errores

    // ---------------------- LÓGICA DE LOGIN ----------------------
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            // Llama a la función de login del contexto (que hace la llamada axios)
            // Pasamos un objeto con las credenciales
            const credentials = {
                correo: correo,
                password: password
            };
            console.log("JSON enviado a /api/token/:", credentials);
            await loginUser(credentials); 
            
            // Si tiene éxito, el contexto se encarga de redirigir (navigate('/'))
        } catch (error) {
            // Captura el error lanzado desde el AuthContext y lo muestra
            setErrorMessage(error.message || "Error desconocido al iniciar sesión.");
            
        } finally {
            setLoading(false); // Detiene el indicador de carga
        }
    };

    const handleClickShowPassword = () => setShowContraseña(!showContraseña);
    const handleMouseDownPassword = (e) => e.preventDefault();

    return (
        <Grid container component="main" sx={{ minHeight: '100vh' }}>
            {/* ... COLUMNA IZQUIERDA (Contenido estático) ... */}
            <Grid 
                item 
                xs={12} 
                sm={6} 
                md={7} 
                sx={{
                    position: 'relative', 
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    backgroundColor: theme.palette.background.default, 
                    color: '#fff',
                    textAlign: 'center',
                    overflow: 'hidden',
                }}
            >
                <div className="login-animation-wrapper">
                    {Array.from(Array(15)).map((_, i) => (
                        <div key={i} className="bubble"></div>
                    ))}
                </div>
                <Box sx={{ zIndex: 2, position: 'relative' }}>
                    <BiotechOutlined sx={{ fontSize: 70, color: 'primary.main' }} />
                    <Typography 
                        variant="h2" 
                        sx={{ fontWeight: 600, mt: 2, letterSpacing: '1px' }}
                    >
                        Software de Formulación
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{ color: 'text.secondary', mt: 1, fontWeight: 300 }}
                    >
                        Precisión y Control.
                    </Typography>
                </Box>
            </Grid>

            {/* --- 2. COLUMNA DERECHA (Formulario) --- */}
            <Grid 
                item 
                xs={12} 
                sm={6} 
                md={5} 
                component={Paper} 
                elevation={6} 
                square 
                sx={{
                    backgroundColor: theme.palette.background.paper, 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 3, md: 6 },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: 400,
                    }}
                >
                    <ScienceOutlined 
                        sx={{ 
                            fontSize: 40, 
                            color: 'primary.main',
                            display: { xs: 'block', sm: 'none' },
                            mb: 2
                        }} 
                    />

                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#fff' }}>
                        Iniciar Sesión
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                        Accede al sistema de formulación
                    </Typography>

                    {/* MOSTRAR ERROR */}
                    {errorMessage && (
                        <Typography 
                            variant="body2" 
                            color="error" 
                            sx={{ mb: 2, fontWeight: 500 }}
                        >
                            {errorMessage}
                        </Typography>
                    )}

                    {/* Formulario */}
                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="correo"
                            label="Correo"
                            name="correo"
                            autoFocus
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutline sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                            InputLabelProps={{ sx: { color: 'text.secondary' } }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&:hover fieldset': { borderColor: 'primary.main' },
                                    color: '#fff',
                                },
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password" // CLAVE CORREGIDA
                            label="Contraseña"
                            type={showContraseña ? 'text' : 'password'}
                            id="contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputLabelProps={{ sx: { color: 'text.secondary' } }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&:hover fieldset': { borderColor: 'primary.main' },
                                    color: '#fff',
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            {showContraseña ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {/* Botón de Login (con carga) */}
                        <LoadingButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            loading={loading}
                            loadingPosition="start"
                            startIcon={<Login />}
                            sx={{
                                mt: 3,
                                py: 1.5,
                                fontWeight: 700,
                                fontSize: '1rem',
                                borderRadius: '10px',
                                textTransform: 'none',
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                '&:hover': {
                                    background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                                    boxShadow: `0 0 15px ${theme.palette.primary.main}55`,
                                },
                            }}
                        >
                            Acceder
                        </LoadingButton>
                    </Box>

                    {/* Pie con info */}
                    <Typography
                        variant="caption"
                        sx={{ color: 'text.disabled', mt: 5, textAlign: 'center' }}
                    >
                        © Implementaciones SIAUMEX {new Date().getFullYear()}
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
}

export default LoginPage;