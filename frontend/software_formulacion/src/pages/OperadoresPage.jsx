import React, { useState, useEffect, useCallback } from 'react';
// ELIMINAR: import axios from 'axios';
// === CAMBIO 1: Importar el hook de autenticación ===
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
import OperadorFormModal from '../components/OperadorFormModal'; 
import BadgeIcon from '@mui/icons-material/Badge'; 
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; 
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; 

// URLs RELATIVAS: Usaremos estas para la instancia de Axios
const API_URL_OPERADORES_REL = '/operadores/';
const API_URL_ESTACIONES_REL = '/estaciones/'; 


// Tema oscuro (tomado del diseño de UsersPage)
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#11998e' },
        background: { paper: '#1e1e1e' },
    },
});

// Componente para tabla vacía (sin cambios)
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

    // === CAMBIO 2: Obtener la instancia protegida ===
    const { axiosInstance } = useAuth(); 
    // ===============================================

    // --- Estados ---
    const [operadores, setOperadores] = useState([]);
    const [estaciones, setEstaciones] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentOperador, setCurrentOperador] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [operadorToDelete, setOperadorToDelete] = useState(null);

    // --- Función READ (Operadores) ---
    const fetchOperadores = useCallback(async () => {
        setLoading(true);
        try {
            // === CAMBIO 3: Usar axiosInstance.get ===
            const response = await axiosInstance.get(API_URL_OPERADORES_REL); 
            // ==========================================
            setOperadores(response.data || []);
        } catch (error) {
            console.error("Error al obtener los operadores:", error);
            setOperadores([]);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]); // <-- Dependencia de seguridad

    // --- Función READ (Estaciones) - Para el Dropdown del Modal ---
    const fetchEstaciones = useCallback(async () => {
        try {
            // === CAMBIO 4: Usar axiosInstance.get (Segunda llamada) ===
            const response = await axiosInstance.get(API_URL_ESTACIONES_REL);
            // ==========================================================
            setEstaciones(response.data.map(est => ({ id: est.idest, nombre: est.nombre })) || []);
        } catch (error) {
            console.error("Error al obtener las estaciones para el modal:", error);
            setEstaciones([]);
        }
    }, [axiosInstance]); // <-- Dependencia de seguridad

    // Cargar datos al montar
    useEffect(() => {
        // Aseguramos que ambas llamadas usen el interceptor
        fetchOperadores();
        fetchEstaciones(); 
    }, [fetchOperadores, fetchEstaciones]);


    // --- Función DELETE (Borrar Operador) ---
    const handleDeleteOperador = async () => {
        if (!operadorToDelete) return;
        try {
            // === CAMBIO 5: Usar axiosInstance.delete ===
            await axiosInstance.delete(`${API_URL_OPERADORES_REL}${operadorToDelete.rfid}/`);
            // ============================================
            console.log('Operador borrado:', operadorToDelete.rfid);
            fetchOperadores(); // Recargar tabla
        } catch (error) {
            console.error('Error al borrar operador:', error.response?.data || error.message);
        } finally {
            handleCloseConfirm();
        }
    };

    // --- Funciones Modales y Columnas (sin cambios funcionales) ---
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

    const columns = [
        { field: 'rfid', headerName: 'RFID', width: 150 },
        { field: 'nombre', headerName: 'Nombre Operador', flex: 1 },
        { field: 'idest', headerName: 'ID Estación Asignada', width: 200 },
        {
            field: 'actions', headerName: 'Acciones', width: 120, sortable: false, disableColumnMenu: true,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenModal(params.row)} sx={{ color: '#38ef7d' }} aria-label="editar">
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
                    <IconButton onClick={() => handleOpenConfirm(params.row)} sx={{ color: '#ff6b6b' }} aria-label="eliminar">
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
        <>
            {/* Encabezado */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3, p: 2,
                    background: '#292929FF',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon sx={{ color: '#FF9800', fontSize: '2rem' }} /> 
                    <Typography
                        variant="h4" component="h1"
                        sx={{ fontWeight: 'bold', color: '#E0E0E0', letterSpacing: '0.5px' }}
                    >
                        Gestión de Operadores 
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenModal()} 
                    sx={{
                        fontWeight: 'bold', borderRadius: '10px', px: 3, py: 1,
                        backgroundColor: '#004F8CFF', color: '#fff',
                        boxShadow: '0 0 10px rgba(0, 119, 209, 0.5)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            backgroundColor: '#005ea8',
                            boxShadow: '0 0 20px rgba(0, 119, 209, 0.8)',
                            transform: 'scale(1.05)',
                        },
                    }}
                >
                    Agregar Operador 
                </Button>
            </Box>

            <ThemeProvider theme={darkTheme}>
                {/* Contenedor de la Tabla */}
                <Paper
                    sx={{
                        flexGrow: 1, width: '100%', borderRadius: '14px', overflow: 'hidden',
                        backgroundColor: '#292929FF', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    <DataGrid
                        rows={operadores} 
                        columns={columns} 
                        loading={loading} 
                        getRowId={(row) => row.rfid} 
                        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                        autoHeight={operadores.length === 0} 
                        sx={{
                            border: 'none', color: '#E0E0E0',
                            '& .MuiDataGrid-columnHeaders': { background: '#292929FF', color: '#F9FAFBFF', fontWeight: 'bold', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.1)', },
                            '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(255,255,255,0.08)', },
                            '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(0,119,209,0.1)', transition: 'background-color 0.3s ease', },
                            '& .Mui-selected': { backgroundColor: 'rgba(0, 119, 209, 0.2) !important', boxShadow: 'inset 0 0 5px rgba(0, 119, 209, 0.3)', },
                            '& .Mui-selected:hover': { backgroundColor: 'rgba(0, 119, 209, 0.25) !important', },
                            '& .MuiDataGrid-footerContainer': { backgroundColor: '#292929FF', borderTop: '1px solid rgba(255,255,255,0.1)', },
                            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { width: '8px' },
                            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': { background: '#1E293B' },
                            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { backgroundColor: '#4B5563', borderRadius: '4px' },
                            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': { background: '#6B7280' },
                        }}
                    />
                </Paper>

                {/* Modal Crear/Editar */}
                <OperadorFormModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSaveSuccess={fetchOperadores} 
                    operadorToEdit={currentOperador}
                    estacionesList={estaciones} 
                />

                {/* Dialog de Confirmación */}
                <Dialog
                    open={confirmOpen}
                    onClose={handleCloseConfirm}
                    PaperProps={{
                        sx: { backgroundColor: '#1E1E1E', color: '#FFFFFF', borderRadius: '12px', boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' },
                    }}
                >
                    <DialogTitle
                        sx={{
                            fontWeight: 'bold', color: '#F87171', display: 'flex', alignItems: 'center', gap: 1
                        }}
                    >
                        <WarningAmberIcon /> Confirmar Eliminación
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ color: '#D1D5DB' }}>
                            ¿Estás seguro de que deseas eliminar al operador
                            <strong style={{ color: '#60A5FA' }}> {operadorToDelete?.nombre}</strong>
                            (RFID: {operadorToDelete?.rfid})?
                            Esta acción no se puede deshacer.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={handleCloseConfirm}
                            sx={{
                                color: '#A5A5A5', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', textTransform: 'none', transition: 'all 0.2s ease', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDeleteOperador} 
                            sx={{
                                color: '#fff', backgroundColor: '#EF4444', fontWeight: 'bold', borderRadius: '8px', px: 2, textTransform: 'none', boxShadow: '0 0 10px rgba(239,68,68,0.4)', transition: 'all 0.3s ease',
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