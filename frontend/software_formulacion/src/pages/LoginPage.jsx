import React, { useState } from 'react';
import { 
    Box, Typography, TextField, Button, Paper, Grid, 
    InputAdornment, IconButton, useTheme 
} from '@mui/material';
import { LoadingButton } from '@mui/lab'; // ¡Para el botón con carga!

// --- Iconos ---
import { 
    PersonOutline, LockOutlined, Visibility, VisibilityOff, 
    ScienceOutlined, // ¡Icono de matraz para el tema!
    Login // Icono para el botón
} from '@mui/icons-material';

// Importamos el CSS para la animación
import './styles/Login.css';

function LoginPage() {
    const theme = useTheme(); // Accedemos al tema
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false); // Estado de carga

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        console.log('Login attempt:', { username, password });
        // Simula una llamada a API
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleMouseDownPassword = (e) => e.preventDefault();

    return (
        <Grid container component="main" sx={{ minHeight: '100vh' }}>
            
            {/* --- 1. COLUMNA IZQUIERDA (Atmosférica) --- */}
            <Grid 
                item 
                xs={12} 
                sm={6} 
                md={7} 
                sx={{
                    position: 'relative', // Para la animación
                    display: { xs: 'none', sm: 'flex' }, // Oculto en móviles
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    // Usamos un color de fondo ligeramente diferente del 'paper'
                    backgroundColor: theme.palette.background.default, 
                    color: '#fff',
                    textAlign: 'center',
                    overflow: 'hidden', // Para contener la animación
                }}
            >
                {/* --- Animación de Burbujas --- */}
                <div className="login-animation-wrapper">
                    {/* Generamos 15 burbujas para la animación */}
                    {Array.from(Array(15)).map((_, i) => (
                        <div key={i} className="bubble"></div>
                    ))}
                </div>

                {/* Contenido de Branding (encima de la animación) */}
                <Box sx={{ zIndex: 2, position: 'relative' }}>
                    <ScienceOutlined sx={{ fontSize: 70, color: 'primary.main' }} />
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
                        Precisión y control
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
                    // Usamos el color 'paper' del tema oscuro
                    backgroundColor: theme.palette.background.paper, 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 3, md: 6 }, // Padding responsivo
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: 400, // Ancho máximo del form
                    }}
                >
                    {/* Logo/Título para móviles (opcional) */}
                    <ScienceOutlined 
                        sx={{ 
                            fontSize: 40, 
                            color: 'primary.main',
                            display: { xs: 'block', sm: 'none' }, // Mostrar solo en móvil
                            mb: 2
                        }} 
                    />

                    {/* Título del Formulario */}
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#fff' }}>
                        Iniciar Sesión
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                        Accede al sistema de formulación
                    </Typography>

                    {/* Formulario */}
                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Usuario"
                            name="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutline sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                            // Estilos del tema oscuro (los que ya tenías)
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
                            name="password"
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
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
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
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
                            color="primary" // Color principal del tema
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
                                // Efecto de gradiente "impactante"
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                '&:hover': {
                                    background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                                    boxShadow: `0 0 15px ${theme.palette.primary.main}55`, // Glow
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
                        © {new Date().getFullYear()}
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
}

export default LoginPage;