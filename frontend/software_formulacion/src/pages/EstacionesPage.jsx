import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EvStationIcon from '@mui/icons-material/EvStation';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Importamos el Modal de Estaciones (asegúrate que la ruta sea correcta)
import EstacionFormModal from '../components/EstacionFormModal';

const API_URL_ESTACIONES_REL = '/estaciones/';

// --- Componente para tabla vacía ---
function CustomNoRowsOverlay() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-color)',
                opacity: 0.6
            }}
        >
            <InfoOutlinedIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="h6">No hay estaciones registradas</Typography>
            <Typography variant="body2">Agrega una nueva para comenzar</Typography>
        </Box>
    );
}

function EstacionesPage() {
    const { axiosInstance } = useAuth();

    // --- Estados ---
    const [estaciones, setEstaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentEstacion, setCurrentEstacion] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [stationToDelete, setStationToDelete] = useState(null);

    // --- Fetch Estaciones ---
    const fetchEstaciones = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(API_URL_ESTACIONES_REL);
            setEstaciones(response.data || []);
        } catch (error) {
            console.error("Error al obtener las estaciones:", error);
            setEstaciones([]);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance]);

    useEffect(() => {
        fetchEstaciones();
    }, [fetchEstaciones]);

    // --- Manejadores de Modal ---
    const handleOpenModal = (estacion = null) => {
        setCurrentEstacion(estacion);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentEstacion(null);
    };

    // --- Manejadores de Confirmación ---
    const handleOpenConfirm = (station) => {
        setStationToDelete(station);
        setConfirmOpen(true);
    };

    const handleCloseConfirm = () => {
        setConfirmOpen(false);
        setStationToDelete(null);
    };

    // --- Borrar Estación ---
    const handleDeleteStation = async () => {
        if (!stationToDelete) return;
        try {
            await axiosInstance.delete(`${API_URL_ESTACIONES_REL}${stationToDelete.idest}/`);
            console.log('Estación borrada:', stationToDelete.idest);
            fetchEstaciones();
        } catch (error) {
            console.error('Error al borrar la estación:', error);
        } finally {
            handleCloseConfirm();
        }
    };

    // --- Columnas de la Tabla ---
    const columns = [
        { field: 'idest', headerName: 'ID Estación', width: 150 },
        { field: 'nombre', headerName: 'Nombre Estación', flex: 1, minWidth: 200 },
        { field: 'obs', headerName: 'Observaciones', flex: 1, minWidth: 250 },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Box sx={{ display: 'flex' }}>
                    <IconButton
                        onClick={() => handleOpenModal(params.row)}
                    >
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
                    <IconButton
                        onClick={() => handleOpenConfirm(params.row)}
                    >
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
        <Box sx={{ width: '100%', pb: 4 }}>

            {/* 1. Encabezado (Tarjeta superior) */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    p: 3,
                    backgroundColor: 'var(--card-bg)', // Adaptable
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid var(--border-color)',
                    transition: 'background-color 0.3s ease'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)', // Fondo amarillo suave para el icono
                        display: 'flex'
                    }}>
                        <EvStationIcon sx={{ color: '#FFC107', fontSize: '2rem' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
                            Gestión de Estaciones
                        </Typography>
                    </Box>
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
                        backgroundColor: '#004F8CFF',
                        color: '#fff',
                        boxShadow: '0 0 10px rgba(0, 119, 209, 0.5)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            backgroundColor: '#005ea8',
                            boxShadow: '0 0 20px rgba(0, 119, 209, 0.8)',
                            transform: 'scale(1.05)',
                        },
                    }}>
                    Agregar Estación
                </Button>
            </Box>

            {/* 2. Tabla (DataGrid) */}
            <Paper
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--card-bg)', // Adaptable
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid var(--border-color)',
                    transition: 'background-color 0.3s ease'
                }}
            >
                <DataGrid
                    rows={estaciones}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.idest}
                    slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                    autoHeight={estaciones.length === 0}
                    sx={{
                        border: 'none',
                        color: 'var(--text-color)',
                        minHeight: 400,

                        // Encabezados
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                            fontWeight: 'bold',
                            borderBottom: '1px solid var(--border-color)',
                        },

                        // Celdas y Filas
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid var(--border-color)',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: 'rgba(128, 128, 128, 0.05)',
                        },

                        // Footer
                        '& .MuiDataGrid-footerContainer': {
                            backgroundColor: 'var(--card-bg)',
                            borderTop: '1px solid var(--border-color)',
                        },

                        // Iconos de paginación
                        '& .MuiTablePagination-root': { color: 'var(--text-color)' },
                        '& .MuiSvgIcon-root': { color: 'var(--text-color)' }
                    }}
                />
            </Paper>

            {/* 3. Modales */}
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
                PaperProps={{
                    sx: {
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-color)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', color: '#F87171', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon /> Confirmar Eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-color)', opacity: 0.8 }}>
                        ¿Estás seguro de que deseas eliminar la estación
                        <strong style={{ color: '#004F8C' }}> {stationToDelete?.nombre}</strong>
                        (ID: {stationToDelete?.idest})?
                        <br />Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleCloseConfirm}
                        sx={{
                            color: 'var(--text-color)',
                            opacity: 0.7,
                            textTransform: 'none',
                            mr: 1,
                            '&:hover': { opacity: 1, backgroundColor: 'transparent' }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDeleteStation}
                        variant="contained"
                        sx={{
                            backgroundColor: '#EF4444',
                            color: '#fff',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            textTransform: 'none',
                            boxShadow: '0 4px 10px rgba(239,68,68,0.4)',
                            '&:hover': { backgroundColor: '#DC2626' },
                        }}
                        autoFocus
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EstacionesPage;