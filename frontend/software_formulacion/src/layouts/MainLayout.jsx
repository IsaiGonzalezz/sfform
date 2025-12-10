import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { Link as RouterLink, useLocation, Outlet } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
    IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Collapse
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useColorMode } from '../context/ThemeContext';
// Iconos Generales
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CategoryIcon from '@mui/icons-material/Category';
import BuildIcon from '@mui/icons-material/Build';

// Iconos Específicos
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import EngineeringIcon from '@mui/icons-material/Engineering';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ScienceIcon from '@mui/icons-material/Science';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FactoryIcon from '@mui/icons-material/Factory';
import Inventory2Icon from '@mui/icons-material/Inventory2';

const drawerWidth = 240;
const collapsedWidth = 72;

const mainItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Fórmulas', path: '/formulas', icon: <ReceiptLongIcon /> },
    { text: 'Producción', path: '/produccion', icon: <FactoryIcon /> },
    { text: 'Inventario', path: '/inventario', icon: <Inventory2Icon /> }
];

const catalogosItems = [
    { text: 'Usuarios', path: '/usuarios', icon: <PeopleIcon /> },
    { text: 'Operadores', path: '/operadores', icon: <EngineeringIcon /> },
    { text: 'Ingredientes', path: '/ingredientes', icon: <ScienceIcon /> },
];

const herramientasItems = [
    { text: 'Empresa', path: '/empresa', icon: <BusinessIcon /> },
    { text: 'Estaciones', path: '/estaciones', icon: <WarehouseIcon /> },
];

function MainLayout() {
    const { user, logoutUser } = useAuth();
    const location = useLocation();
    const theme = useTheme();
    const { toggleColorMode, mode } = useColorMode();

    const [open, setOpen] = useState(false);
    //const [isDarkMode, setIsDarkMode] = useState(true);
    const [menuOpen, setMenuOpen] = useState({ catalogos: false, herramientas: false });

    const handleToggleDrawer = () => setOpen(!open);

    const handleSubMenuClick = (menu) => {
        if (!open) {
            setOpen(true);
            setTimeout(() => {
                setMenuOpen(prev => ({ ...prev, [menu]: true }));
            }, 100);
        } else {
            setMenuOpen(prev => ({ ...prev, [menu]: !prev[menu] }));
        }
    };

    const transition = (props) => theme.transitions.create(props, {
        easing: theme.transitions.easing.sharp,
        duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
    });

    const renderNavItem = (item) => (
        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.08)' },
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
                }}
            >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: theme.palette.text.primary }}>
                    {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0, transition: 'opacity 0.3s' }} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
        </ListItem>
    );

    const renderSubItem = (item) => (
        <ListItemButton
            key={item.text}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
                pl: 4,
                '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.08)' },
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
            }}
        >
            <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2' }} />
        </ListItemButton>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
            {/* ======= APPBAR ======= */}
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? '#000000'
                        : '#ffffff',
                    color: (theme) => theme.palette.mode === 'dark'
                        ? theme.palette.text.primary
                        : theme.palette.text.primary,
                    boxShadow: 'none',
                    borderBottom: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.12)'
                        : '1px solid rgba(0,0,0,0.12)',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    transition: (theme) => theme.transitions.create(['left', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    left: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
                    width: open ? `calc(100% - ${drawerWidth}px)` : `calc(100% - ${collapsedWidth}px)`,
                }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        SIAUMEX - Formulación
                    </Typography>
                    {/* Switch de Tema */}
                    <IconButton
                        onClick={toggleColorMode}
                        color="inherit"
                        title={mode === 'dark' ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                    >
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '16px',
                            fontWeight: 'bold',
                            backgroundColor: (theme) => theme.palette.mode === 'dark'
                                ? '#3e3e3eff'
                                : 'rgba(0, 0, 0, 0.06)',
                            color: (theme) => theme.palette.mode === 'dark'
                                ? 'white'
                                : theme.palette.text.primary,
                            border: (theme) => theme.palette.mode === 'dark'
                                ? 'none'
                                : '1px solid rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ color: 'inherit', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {user ? user.nombre : 'Usuario'}
                        </Typography>
                    </Box>
                </Toolbar>
            </AppBar>


            {/* ======= DRAWER ======= */}
            <Drawer
                variant="permanent"
                open={open}
                sx={{
                    width: open ? drawerWidth : collapsedWidth,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    transition: transition('width'),
                    '& .MuiDrawer-paper': {
                        width: open ? drawerWidth : collapsedWidth,
                        transition: transition('width'),
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        borderRight: 'none',
                        overflowX: 'hidden',
                        // ESTO ES CLAVE: Flex column para empujar items al fondo
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <Toolbar sx={{ display: 'flex', justifyContent: open ? 'flex-end' : 'center', px: open ? 1 : 0.5 }}>
                    <IconButton onClick={handleToggleDrawer}>
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                </Toolbar>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

                {/* Lista de Navegación (flexGrow: 1 no es estrictamente necesario si usamos mt:auto abajo, pero ayuda) */}
                <List>
                    {mainItems.map(renderNavItem)}

                    <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />

                    {/* Catálogos */}
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            onClick={() => handleSubMenuClick('catalogos')}
                            sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: theme.palette.text.primary }}>
                                <CategoryIcon />
                            </ListItemIcon>
                            <ListItemText primary="Catálogos" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ variant: 'body2' }} />
                            {open ? (menuOpen.catalogos ? <ExpandLess /> : <ExpandMore />) : null}
                        </ListItemButton>
                    </ListItem>
                    <Collapse in={open && menuOpen.catalogos} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {catalogosItems.map(renderSubItem)}
                        </List>
                    </Collapse>

                    {/* Herramientas */}
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            onClick={() => handleSubMenuClick('herramientas')}
                            sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: theme.palette.text.primary }}>
                                <BuildIcon />
                            </ListItemIcon>
                            <ListItemText primary="Herramientas" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ variant: 'body2' }} />
                            {open ? (menuOpen.herramientas ? <ExpandLess /> : <ExpandMore />) : null}
                        </ListItemButton>
                    </ListItem>
                    <Collapse in={open && menuOpen.herramientas} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {herramientasItems.map(renderSubItem)}
                        </List>
                    </Collapse>
                </List>

                {/* ======= ITEMS INFERIORES (LOGOUT Y TEMA) ======= */}
                {/* marginTop: 'auto' es el truco para empujarlo al fondo */}
                <List sx={{ marginTop: 'auto' }}>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

                    {/* Logout */}
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            onClick={logoutUser}
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? 'initial' : 'center',
                                px: 2.5,
                                '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }, // Un rojito sutil al hacer hover en salir
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: theme.palette.error.main }}>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Cerrar Sesión" sx={{ opacity: open ? 1 : 0, color: theme.palette.error.main }} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItemButton>
                    </ListItem>
                </List>

            </Drawer>

            {/* ======= MAIN CONTENT ======= */}
            <Box component="main" sx={{ flexGrow: 1, backgroundColor: theme.palette.background.default, p: 3, height: '100vh', display: 'flex', flexDirection: 'column', transition: transition(['margin']), minWidth: 0, minHeight: '100vh', overflow: 'auto' }}>
                <Toolbar />
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}

export default MainLayout;