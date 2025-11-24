import React, { useState, useEffect, useCallback } from 'react'; // <-- 1. Importamos useEffect
import { useAuth } from '../context/useAuth';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UserFormModal from '../components/UserFormModal';
import GroupIcon from '@mui/icons-material/Group'; // <-- Icono para Usuarios
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // <-- Icono para Advertencia
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const API_URL = 'http://127.0.0.1:8000/api/usuarios/';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#11998e' },
        background: { paper: '#1e1e1e' },
    },
});


function CustomNoRowsOverlay() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
            }}
        >
            <InfoOutlinedIcon sx={{ fontSize: 48, color: 'grey.500' }} />
            <Typography variant="h6" sx={{ mt: 1, color: 'grey.500' }}>
                No hay datos {/* O "No hay usuarios", "No hay estaciones", etc. */}
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
                Agrega uno nuevo para comenzar
            </Typography>
        </Box>
    );
}


function UsersPage() {
    const { axiosInstance } = useAuth();
    // --- 3. Creamos el estado para guardar los usuarios y el estado de carga ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); // Empezamos en 'cargando'
    const [isModalOpen, setModalOpen] = useState(false);
    // --- Almacena el usuario que vamos a editar ---
    const [currentUser, setCurrentUser] = useState(null);
    // Estados para la ventana de confirmación y eliminación ---
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    //Creamos una función reutilizable para obtener los usuarios ---
    // useCallback es una optimización para evitar que esta función se recree innecesariamente
    const fetchUsers = useCallback(async () => {
        setLoading(true); // Ponemos en estado de carga
        try {
            const response = await axiosInstance.get(API_URL);
            setUsers(response.data);
        } catch (error) {
            console.error("Hubo un error al obtener los usuarios:", error);
        } finally {
            setLoading(false); // Quitamos el estado de carga
        }
    }, [axiosInstance]); // El array vacío significa que la función no cambia

    // useEffect ahora simplemente llama a nuestra nueva función
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);


    // --- Funciones para abrir y cerrar la modal ---
    const handleOpenModal = (user = null) => {
        // Si recibimos un usuario, lo guardamos en el estado para editarlo
        // Si no, lo ponemos en 'null' para crear uno nuevo
        setCurrentUser(user);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentUser(null); // Limpiamos el estado al cerrar
    };

    //Función para ABRIR la confirmación de borrado ---
    const handleOpenConfirm = (user) => {
        setUserToDelete(user); // Guardamos qué usuario vamos a borrar
        setConfirmOpen(true);  // Abrimos la ventana de confirmación
    };

    // --- Función para CERRAR la confirmación ---
    const handleCloseConfirm = () => {
        setConfirmOpen(false);
        setUserToDelete(null); // Limpiamos el usuario a borrar
    };


    //. La función que BORRA el usuario ---
    const handleDeleteUser = async () => {
        if (!userToDelete) return; // Seguridad por si acaso

        try {
            // Hacemos la petición DELETE a la URL específica del usuario
            await axiosInstance.delete(`${API_URL}${userToDelete.id}/`);
            console.log('Usuario borrado exitosamente:', userToDelete.id);
            fetchUsers(); // Recargamos la tabla para que desaparezca el usuario
        } catch (error) {
            console.error('Hubo un error al borrar el usuario:', error.response?.data || error.message);
            // Aquí podrías mostrar un mensaje de error
        } finally {
            handleCloseConfirm(); // Cerramos la ventana de confirmación
        }
    };


    const columns = [
        { field: 'rfid', headerName: 'RFID', width: 150 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'correo', headerName: 'Correo', width: 200 },
        { field: 'rol', headerName: 'Rol', width: 150 },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Box>
                    {/* El botón de editar ahora llama a 'handleOpenModal' con los datos de la fila */}
                    <IconButton onClick={() => handleOpenModal(params.row)} sx={{ color: '#38ef7d' }}>
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenConfirm(params.row)} sx={{ color: '#ff6b6b' }}>
                        <DeleteOutlineIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <>
            {/* Encabezado */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3, // Incrementado margen inferior
                    p: 2,
                    background: 'linear-gradient(90deg, #292929FF, #292929FF)', // Fondo degradado sutil
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', // Sombra más sutil
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}> {/* Contenedor para icono y texto */}
                    <GroupIcon sx={{ color: '#318EFFFF', fontSize: '2rem' }} /> {/* <-- Icono Usuarios */}
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            color: '#E0E0E0',
                            letterSpacing: '0.5px',
                            // textShadow: '0 0 10px rgba(0, 119, 209, 0.3)', // Sombra de texto opcional
                        }}
                    >
                        Gestión de Usuarios
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenModal()}
                    sx={{
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        px: 3,
                        py: 1,
                        // --- CAMBIO: Color azul sólido ---
                        backgroundColor: '#004F8CFF', // Azul principal
                        color: '#fff',
                        boxShadow: '0 0 10px rgba(0, 119, 209, 0.5)', // Mantenemos sombra azul
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            backgroundColor: '#005ea8', // Azul un poco más oscuro al pasar el mouse
                            boxShadow: '0 0 20px rgba(0, 119, 209, 0.8)', // Mantenemos y aumentamos sombra
                            transform: 'scale(1.05)',
                        },
                    }}
                >
                    Agregar Usuario
                </Button>
            </Box>

            <ThemeProvider theme={darkTheme}>
                <Paper
                    sx={{
                        flexGrow: 1,
                        width: '100%',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        backgroundColor: '#292929FF', // Fondo del Paper/Tabla
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', // Sombra más sutil
                    }}
                >
                    <DataGrid
                        rows={users}
                        columns={columns}
                        loading={loading}
                        getRowId={(row) => row.rfid}
                        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                        autoHeight={users.length === 0}
                        sx={{
                            border: 'none',
                            color: '#E0E0E0', // Color general del texto en la tabla
                            // Encabezados de Columna
                            '& .MuiDataGrid-columnHeaders': {
                                background: 'linear-gradient(90deg, #1E293B, #0F172A)', // Fondo degradado
                                color: '#DFF1FFFF', // Color azul claro para títulos
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                
                            },
                            // Celdas
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(255,255,255,0.08)', // Borde más sutil
                            },
                            // Hover sobre Fila
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: 'rgba(0,119,209,0.1)', // Azul más sutil
                                transition: 'background-color 0.3s ease',
                            },
                            // Fila Seleccionada
                            '& .Mui-selected': {
                                backgroundColor: 'rgba(0, 119, 209, 0.2) !important', // Azul semitransparente para selección
                                boxShadow: 'inset 0 0 5px rgba(0, 119, 209, 0.3)', // Sombra interior
                            },
                            '& .Mui-selected:hover': { // Hover sobre fila seleccionada
                                backgroundColor: 'rgba(0, 119, 209, 0.25) !important',
                            },
                            // Footer de la Tabla
                            '& .MuiDataGrid-footerContainer': {
                                backgroundColor: '#292929FF', // Fondo oscuro
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                            },
                            // Scrollbars
                            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { width: '8px' },
                            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': { background: '#3B1E1EFF' },
                            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { backgroundColor: '#4B5563', borderRadius: '4px' },
                            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': { background: '#545454FF' },
                        }}
                    />
                </Paper>

                {/* Modal de usuario (sin cambios en la llamada) */}
                <UserFormModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSaveSuccess={fetchUsers}
                    userToEdit={currentUser}
                />

                {/* Dialog de Confirmación de borrado */}
                <Dialog
                    open={confirmOpen}
                    onClose={handleCloseConfirm}
                    PaperProps={{
                        sx: {
                            backgroundColor: '#1E1E1E',
                            color: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)',
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            fontWeight: 'bold',
                            color: '#F87171',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <WarningAmberIcon /> {/* <-- Icono Advertencia */}
                        Confirmar Eliminación
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ color: '#D1D5DB' }}>
                            ¿Estás seguro de que deseas eliminar al usuario
                            <strong style={{ color: '#60A5FA' }}> {userToDelete?.nombre}</strong>?
                            Esta acción no se puede deshacer.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={handleCloseConfirm}
                            sx={{
                                color: '#A5A5A5',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                textTransform: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDeleteUser}
                            sx={{
                                color: '#fff',
                                backgroundColor: '#EF4444', // Rojo
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                px: 2,
                                textTransform: 'none',
                                boxShadow: '0 0 10px rgba(239,68,68,0.4)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: '#DC2626', // Rojo más oscuro
                                    boxShadow: '0 0 20px rgba(239,68,68,0.7)',
                                    transform: 'scale(1.05)',
                                },
                            }}
                            autoFocus
                        >
                            Eliminar
                        </Button>
                    </DialogActions>
                </Dialog>
            </ThemeProvider>
        </>
    );

}

export default UsersPage;