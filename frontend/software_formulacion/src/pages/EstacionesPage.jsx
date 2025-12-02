import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth'; 
// ===============================================
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EstacionFormModal from '../components/EstacionFormModal'; // <-- Modal de Estaciones
import EvStationIcon from '@mui/icons-material/EvStation'; // <-- Icono para Estaciones
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // <-- Icono para Advertencia
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // <-- Icono para Tabla Vacía

// URL RELATIVA: Usaremos la ruta relativa para la instancia de Axios
const API_URL_ESTACIONES_REL = '/estaciones/';

// Tema oscuro (tomado del diseño de UsersPage)
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#11998e' },
        background: { paper: '#1e1e1e' },
    },
});

// Componente para tabla vacía (tomado del diseño de UsersPage)
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
                No hay estaciones
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
                Agrega una nueva para comenzar
            </Typography>
        </Box>
    );
}


function EstacionesPage() {

    // === CAMBIO 2: Obtener la instancia protegida ===
    const { axiosInstance } = useAuth(); 
    // ===============================================

    // --- Estados (Lógica de EstacionesPage) ---
    const [estaciones, setEstaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentEstacion, setCurrentEstacion] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [stationToDelete, setStationToDelete] = useState(null);

    // --- Función READ (Petición GET) ---
    const fetchEstaciones = useCallback(async () => {
        setLoading(true);
        try {
            // === CAMBIO 3: Usar axiosInstance.get ===
            const response = await axiosInstance.get(API_URL_ESTACIONES_REL);
            // =========================================
            setEstaciones(response.data || []); 
        } catch (error) {
            console.error("Error al obtener las estaciones:", error);
            // El Interceptor maneja el 401; si llega un error, limpiamos.
            setEstaciones([]); 
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]); // <-- Dependencia añadida para el hook

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchEstaciones();
    }, [fetchEstaciones]);

    // --- Funciones para Modal C/U (Lógica de EstacionesPage) ---
    const handleOpenModal = (estacion = null) => {
        setCurrentEstacion(estacion);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentEstacion(null);
    };

    // --- Funciones para Confirmación DELETE (Lógica de EstacionesPage) ---
    const handleOpenConfirm = (station) => {
        setStationToDelete(station);
        setConfirmOpen(true);
    };

    const handleCloseConfirm = () => {
        setConfirmOpen(false);
        setStationToDelete(null);
    };

    // --- Función DELETE (Lógica de EstacionesPage) ---
    const handleDeleteStation = async () => {
        if (!stationToDelete) return;
        try {
            // === CAMBIO 4: Usar axiosInstance.delete ===
            // Usa la URL relativa + el ID de la estación
            await axiosInstance.delete(`${API_URL_ESTACIONES_REL}${stationToDelete.idest}/`);
            // ============================================
            console.log('Estación borrada:', stationToDelete.idest);
            fetchEstaciones(); // Recargar la tabla
        } catch (error) {
            console.error('Error al borrar la estación:', error.response?.data || error.message);
        } finally {
            handleCloseConfirm(); // Siempre cerrar la confirmación
        }
    };

    // --- Columnas de la Tabla (Definición de EstacionesPage) ---
    const columns = [
        { field: 'idest', headerName: 'ID Estación', width: 150 },
        { field: 'nombre', headerName: 'Nombre Estación', flex: 1 },
        { field: 'obs', headerName: 'Observaciones', width: 250 },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenModal(params.row)} aria-label="editar">
                        <EditIcon 
                            style={{
                                backgroundColor: '#229D1BFF',   // fondo
                                borderRadius: '8px',          // esquinas redondeadas
                                padding: '6px',               // espacio interno alrededor del ícono
                                color: '#FFFFFF',                // color del ícono
                                fontSize: '32px'              // tamaño del ícono
                            }}
                        />
                    </IconButton>
                    <IconButton onClick={() => handleOpenConfirm(params.row)} aria-label="eliminar">
                        <DeleteOutlineIcon 
                            style={{
                                backgroundColor: '#9D1B1BFF',   // fondo
                                borderRadius: '8px',          // esquinas redondeadas
                                padding: '6px',               // espacio interno alrededor del ícono
                                color: '#FFFFFF',                // color del ícono
                                fontSize: '32px'              // tamaño del ícono
                            }}
                        />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <ThemeProvider theme={darkTheme}>
            {/* Encabezado (Diseño de UsersPage) */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3, p: 2,
                    background: 'linear-gradient(90deg, #292929FF, #292929FF)', // Fondo
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', // Sombra
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Icono y Título (Adaptado para Estaciones) */}
                    <EvStationIcon sx={{ color: '#FFC107', fontSize: '2rem' }} /> {/* <-- Icono Estaciones (color ámbar) */}
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{ fontWeight: 'bold', color: '#E0E0E0', letterSpacing: '0.5px' }}
                    >
                        Gestión de Estaciones
                    </Typography>
                </Box>

                
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenModal()} // Lógica de Estaciones
                    sx={{
                        fontWeight: 'bold', borderRadius: '10px', px: 3, py: 1,
                        backgroundColor: '#004F8CFF', // Azul principal
                        color: '#fff',
                        boxShadow: '0 0 10px rgba(0, 119, 209, 0.5)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            backgroundColor: '#005ea8',
                            boxShadow: '0 0 20px rgba(0, 119, 209, 0.8)',
                            transform: 'scale(1.05)',
                        },
                    }}
                >
                    Agregar Estación {/* <-- Texto Adaptado */}
                </Button>
            </Box>

            {/* Contenedor de la Tabla (Diseño de UsersPage) */}
            <Paper
                sx={{
                    flexGrow: 1, width: '100%', borderRadius: '14px', overflow: 'hidden',
                    backgroundColor: '#292929FF', // Fondo del Paper/Tabla
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                }}
            >
                {/* Tabla (Diseño de UsersPage, Datos de EstacionesPage) */}
                <DataGrid
                    rows={estaciones} // <-- Lógica Estaciones
                    columns={columns} // <-- Lógica Estaciones
                    loading={loading} // <-- Lógica Estaciones
                    getRowId={(row) => row.idest} // <-- Lógica Estaciones
                    slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                    autoHeight={estaciones.length === 0} // <-- Lógica Estaciones
                    sx={{
                        // --- Estilos de UsersPage ---
                        border: 'none', color: '#E0E0E0',
                        '& .MuiDataGrid-columnHeaders': {
                            background: 'linear-gradient(90deg, #292929FF, #292929FF)',
                            color: '#E3EFF9FF',
                            fontWeight: 'bold',
                            fontSize: '0.95rem',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: 'rgba(0,119,209,0.1)',
                            transition: 'background-color 0.3s ease',
                        },
                        '& .Mui-selected': {
                            backgroundColor: 'rgba(0, 119, 209, 0.2) !important',
                            boxShadow: 'inset 0 0 5px rgba(0, 119, 209, 0.3)',
                        },
                        '& .Mui-selected:hover': {
                            backgroundColor: 'rgba(0, 119, 209, 0.25) !important',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            backgroundColor: '#292929FF',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                        },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { width: '8px' },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': { background: '#1E293B' },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { backgroundColor: '#4B5563', borderRadius: '4px' },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': { background: '#6B7280' },
                    }}
                />
            </Paper>

            {/* Modal para Crear/Editar */}
            <EstacionFormModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onSaveSuccess={fetchEstaciones}
                estacionToEdit={currentEstacion}
            />

            {/* Dialog de Confirmación */}
            <Dialog
                open={confirmOpen}
                onClose={handleCloseConfirm}
                PaperProps={{ sx: { backgroundColor: '#1E1E1E', color: '#FFFFFF', borderRadius: '12px', boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)', }, }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', color: '#F87171', display: 'flex', alignItems: 'center', gap: 1 }}><WarningAmberIcon />Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#D1D5DB' }}>
                        ¿Estás seguro de que deseas eliminar la estación
                        <strong style={{ color: '#60A5FA' }}> {stationToDelete?.nombre}</strong>
                        (ID: {stationToDelete?.idest})?
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseConfirm} sx={{ color: '#A5A5A5', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', textTransform: 'none', transition: 'all 0.2s ease', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }, }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDeleteStation}
                        sx={{
                            color: '#fff', backgroundColor: '#EF4444', fontWeight: 'bold', borderRadius: '8px', px: 2, textTransform: 'none', boxShadow: '0 0 10px rgba(239,68,68,0.4)', transition: 'all 0.3s ease',
                            '&:hover': { backgroundColor: '#DC2626', boxShadow: '0 0 20px rgba(239,68,68,0.7)', transform: 'scale(1.05)', },
                        }}
                        autoFocus
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}

export default EstacionesPage;