import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
    IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Iconos
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import EngineeringIcon from '@mui/icons-material/Engineering';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ScienceIcon from '@mui/icons-material/Science';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FactoryIcon from '@mui/icons-material/Factory';

const drawerWidth = 240;
const collapsedWidth = 72;

const navItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Usuarios', path: '/usuarios', icon: <PeopleIcon /> },
    { text: 'Estaciones', path: '/estaciones', icon: <WarehouseIcon /> },
    { text: 'Operadores', path: '/operadores', icon: <EngineeringIcon /> },
    { text: 'Empresa', path: '/empresa', icon: <BusinessIcon /> },
    { text: 'Ingredientes', path: '/ingredientes', icon: <ScienceIcon /> },
    { text: 'Formulas', path: '/formulas', icon: <ReceiptLongIcon /> },
    { text: 'Produccion', path: '/produccion', icon: <FactoryIcon />}
];

function MainLayout({ children }) {
    const location = useLocation();
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const handleToggleDrawer = () => setOpen(!open);

    const transition = (props) => theme.transitions.create(props, {
        easing: theme.transitions.easing.sharp,
        duration: open
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
    });

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
            {/* ======= APPBAR (ESTO ESTÁ BIEN) ======= */}
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: '#000000FF',
                    color: theme.palette.text.primary,
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    zIndex: theme.zIndex.drawer + 1,
                    transition: transition(['left', 'width']),
                    left: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
                    width: open
                        ? `calc(100% - ${drawerWidth}px)`
                        : `calc(100% - ${collapsedWidth}px)`,
                }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Software Formulación
                    </Typography>

                    <IconButton onClick={() => setIsDarkMode(!isDarkMode)} color="inherit">
                        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <IconButton color="inherit">
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            
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
                    },
                }}
            >
                <Toolbar sx={{
                    display: 'flex',
                    justifyContent: open ? 'flex-end' : 'center',
                    px: open ? 1 : 0.5,
                }}>
                    <IconButton onClick={handleToggleDrawer}>
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                </Toolbar>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

                <List>
                    {navItems.map((item) => (
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
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 2 : 'auto',
                                        justifyContent: 'center',
                                        color: theme.palette.text.primary,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{
                                        opacity: open ? 1 : 0,
                                        transition: 'opacity 0.3s',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* ======= CONTENIDO (AQUÍ ESTÁ EL ARREGLO) ======= */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1, // Esto SÍ se queda. Hace que ocupe el espacio sobrante.
                    backgroundColor: theme.palette.background.default,
                    p: 3,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: transition(['margin']),
                    minWidth: 0,
                    minHeight: '100vh',
                    overflow: 'auto',
                }}
            >
                <Toolbar />
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}

export default MainLayout;