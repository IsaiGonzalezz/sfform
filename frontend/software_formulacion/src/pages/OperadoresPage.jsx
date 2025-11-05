import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OperadorFormModal from '../components/OperadorFormModal'; // <-- Modal de Operador
import BadgeIcon from '@mui/icons-material/Badge'; // <-- Icono para Operadores
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // <-- Icono para Advertencia
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // <-- Icono para Tabla Vacía

// URLs de API
const API_URL_OPERADORES = 'http://127.0.0.1:8000/api/operadores/';
const API_URL_ESTACIONES = 'http://127.0.0.1:8000/api/estaciones/'; // Necesaria para el modal

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
                No hay operadores
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
                Agrega uno nuevo para comenzar
            </Typography>
        </Box>
    );
}


function OperadoresPage() {

    // --- Estados (Lógica de OperadoresPage) ---
    const [operadores, setOperadores] = useState([]);
    const [estaciones, setEstaciones] = useState([]); // Almacena lista de estaciones para el dropdown
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentOperador, setCurrentOperador] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [operadorToDelete, setOperadorToDelete] = useState(null);

    // --- Función READ (Operadores) ---
    const fetchOperadores = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL_OPERADORES);
            setOperadores(response.data);
        } catch (error) {
            console.error("Error al obtener los operadores:", error);
            setOperadores([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Función READ (Estaciones) - Para el Dropdown del Modal ---
    const fetchEstaciones = useCallback(async () => {
        try {
            const response = await axios.get(API_URL_ESTACIONES);
            setEstaciones(response.data.map(est => ({ id: est.idest, nombre: est.nombre })));
        } catch (error) {
            console.error("Error al obtener las estaciones para el modal:", error);
            setEstaciones([]);
        }
    }, []);

    // Cargar datos al montar
    useEffect(() => {
        fetchOperadores();
        fetchEstaciones(); // Carga las estaciones también
    }, [fetchOperadores, fetchEstaciones]);


    // --- Funciones Modales (Abrir/Cerrar) ---
    const handleOpenModal = (operador = null) => {
        setCurrentOperador(operador);
        setModalOpen(true);
    };
    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentOperador(null);
    };
    const handleOpenConfirm = (operador) => {
        setOperadorToDelete(operador);
        setConfirmOpen(true);
    };
    const handleCloseConfirm = () => {
        setConfirmOpen(false);
        setOperadorToDelete(null);
    };

    // --- Función DELETE (Borrar Operador) ---
    const handleDeleteOperador = async () => {
        if (!operadorToDelete) return;
        try {
            await axios.delete(`${API_URL_OPERADORES}${operadorToDelete.rfid}/`);
            console.log('Operador borrado:', operadorToDelete.rfid);
            fetchOperadores(); // Recargar tabla
        } catch (error) {
            console.error('Error al borrar operador:', error.response?.data || error.message);
        } finally {
            handleCloseConfirm();
        }
    };

    // --- Columnas Tabla (Lógica de OperadoresPage) ---
    const columns = [
        { field: 'rfid', headerName: 'RFID', width: 150 },
        { field: 'nombre', headerName: 'Nombre Operador', flex: 1 },
        {
            field: 'idest', 
            headerName: 'ID Estación Asignada',
            width: 200,
            
        },
        {
            field: 'actions', headerName: 'Acciones', width: 120, sortable: false, disableColumnMenu: true,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenModal(params.row)} sx={{ color: '#38ef7d' }} aria-label="editar">
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenConfirm(params.row)} sx={{ color: '#ff6b6b' }} aria-label="eliminar">
                        <DeleteOutlineIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];


    return (
        <>
            {/* Encabezado (Diseño de UsersPage) */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3, 
                    p: 2,
                    background: '#292929FF',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Icono y Título (Adaptado para Operadores) */}
                    <BadgeIcon sx={{ color: '#FF9800', fontSize: '2rem' }} /> {/* <-- Icono Operadores (Naranja) */}
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            color: '#E0E0E0',
                            letterSpacing: '0.5px',
                        }}
                    >
                        Gestión de Operadores 
                    </Typography>
                </Box>

                {/* Botón (Diseño de UsersPage) */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenModal()} // Lógica de Operadores
                    sx={{
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        px: 3,
                        py: 1,
                        backgroundColor: '#004F8CFF', 
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
                    Agregar Operador {/* <-- Texto Adaptado */}
                </Button>
            </Box>

            <ThemeProvider theme={darkTheme}>
                {/* Contenedor de la Tabla (Diseño de UsersPage) */}
                <Paper
                    sx={{
                        flexGrow: 1,
                        width: '100%',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        backgroundColor: '#292929FF', 
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    {/* Tabla (Diseño de UsersPage, Datos de OperadoresPage) */}
                    <DataGrid
                        rows={operadores} // <-- Lógica Operadores
                        columns={columns} // <-- Lógica Operadores
                        loading={loading} // <-- Lógica Operadores
                        getRowId={(row) => row.rfid} // <-- Lógica Operadores
                        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                        autoHeight={operadores.length === 0} // <-- Lógica Operadores
                        sx={{
                            // --- Estilos de UsersPage ---
                            border: 'none',
                            color: '#E0E0E0',
                            '& .MuiDataGrid-columnHeaders': {
                                background: '#292929FF',
                                color: '#F9FAFBFF',
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

                {/* Modal Crear/Editar (Lógica de OperadoresPage) */}
                <OperadorFormModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSaveSuccess={fetchOperadores} // Recarga operadores
                    operadorToEdit={currentOperador}
                    estacionesList={estaciones} // Pasa la lista de estaciones al modal
                />

                {/* Dialog de Confirmación (Diseño de UsersPage, Lógica de OperadoresPage) */}
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
                        {/* Texto adaptado para Operadores */}
                        <DialogContentText sx={{ color: '#D1D5DB' }}>
                            ¿Estás seguro de que deseas eliminar al operador
                            <strong style={{ color: '#60A5FA' }}> {operadorToDelete?.nombre}</strong>
                            (RFID: {operadorToDelete?.rfid})?
                            Esta acción no se puede deshacer.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        {/* Botón Cancelar (Diseño UsersPage) */}
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
                        {/* Botón Eliminar (Diseño UsersPage) */}
                        <Button
                            onClick={handleDeleteOperador} // <-- Lógica de Operadores
                            sx={{
                                color: '#fff',
                                backgroundColor: '#EF4444', 
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                px: 2,
                                textTransform: 'none',
                                boxShadow: '0 0 10px rgba(239,68,68,0.4)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: '#DC2626', 
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

export default OperadoresPage;