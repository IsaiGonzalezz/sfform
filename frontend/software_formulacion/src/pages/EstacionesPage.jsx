import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Checkbox,
    FormControlLabel, Switch // <--- 1. Switch
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'; // <--- 2. Icono Restaurar
import EvStationIcon from '@mui/icons-material/EvStation';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Importamos el Modal de Estaciones
import EstacionFormModal from '../components/EstacionFormModal';

const API_URL_ESTACIONES_REL = '/estaciones/';

// --- Componente para tabla vacía ---
function CustomNoRowsOverlay() {
    return (
        <Box
            sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-color)', opacity: 0.6
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
    
    // NUEVO: Estado Switch
    const [showDeleted, setShowDeleted] = useState(false);

    // --- Fetch Estaciones ---
    const fetchEstaciones = useCallback(async () => {
        setLoading(true);
        try {
            // Lógica del filtro
            const url = showDeleted 
                ? `${API_URL_ESTACIONES_REL}?verTodos=true` 
                : API_URL_ESTACIONES_REL;

            const response = await axiosInstance.get(url);
            setEstaciones(response.data || []);
        } catch (error) {
            console.error("Error al obtener las estaciones:", error);
            setEstaciones([]);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, showDeleted]); // <--- Dependencia showDeleted

    useEffect(() => {
        fetchEstaciones();
    }, [fetchEstaciones]);

    // --- Manejadores de Modal ---
    const handleOpenModal = (estacion = null) => { setCurrentEstacion(estacion); setModalOpen(true); };
    const handleCloseModal = () => { setModalOpen(false); setCurrentEstacion(null); };

    // --- Manejadores de Confirmación ---
    const handleOpenConfirm = (station) => { setStationToDelete(station); setConfirmOpen(true); };
    const handleCloseConfirm = () => { setConfirmOpen(false); setStationToDelete(null); };

    // --- Borrar (Desactivar) Estación ---
    const handleDeleteStation = async () => {
        if (!stationToDelete) return;
        try {
            // Usamos DELETE (soft-delete en backend)
            await axiosInstance.patch(`${API_URL_ESTACIONES_REL}${stationToDelete.IdEst}`);
            console.log('Estación desactivada:', stationToDelete.IdEst);
            fetchEstaciones();
        } catch (error) {
            console.error('Error al desactivar la estación:', error);
        } finally {
            handleCloseConfirm();
        }
    };

    // --- NUEVO: Restaurar (Activar) Estación ---
    const handleRestoreStation = async (id) => {
        if (!window.confirm("¿Deseas restaurar esta estación?")) return;
        try {
            // Ajusta la ruta si es diferente en tu backend
            await axiosInstance.put(`${API_URL_ESTACIONES_REL}activar/${id}`);
            fetchEstaciones();
        } catch (error) {
            console.error("Error al restaurar:", error);
            alert("No se pudo restaurar la estación.");
        }
    };

    // --- Columnas de la Tabla ---
    const columns = [
        { field: 'IdEst', headerName: 'ID Estación', width: 150 },
        { field: 'Nombre', headerName: 'Nombre Estación', flex: 1, minWidth: 200 },
        { field: 'Obs', headerName: 'Observaciones', flex: 1, minWidth: 250 },
        {
            field: 'activo', headerName: 'Estatus', width: 100,
            renderCell: (params) => (
                <Checkbox 
                    checked={Boolean(params.value)} 
                    disabled 
                    size="small" 
                    sx={{ 
                        color: params.value ? 'success.main' : 'text.disabled',
                        '&.Mui-checked': { color: 'success.main' }
                    }}
                />
            ),
        },
        {
            field: 'actions', headerName: 'Acciones', width: 150, sortable: false, disableColumnMenu: true,
            renderCell: (params) => {
                const isActive = params.row.activo;

                return (
                    <Box display="flex" gap={1} alignItems="center" height="100%">
                        {isActive ? (
                            // ACCIONES NORMALES
                            <>
                                <IconButton onClick={() => handleOpenModal(params.row)}
                                    sx={{ backgroundColor: '#229D1B', borderRadius: '8px', padding: '6px', '&:hover': { backgroundColor: '#1b8016' } }}>
                                    <EditIcon sx={{ fontSize: '20px',color: '#ffffff !important' }} />
                                </IconButton>
                                <IconButton onClick={() => handleOpenConfirm(params.row)}
                                    sx={{ backgroundColor: '#9D1B1B', color: 'var(--text-color)', borderRadius: '8px', padding: '6px', '&:hover': { backgroundColor: '#7a1515' } }}>
                                    <DeleteOutlineIcon sx={{ fontSize: '20px', color: '#ffffff !important' }} />
                                </IconButton>
                            </>
                        ) : (
                            // ACCIÓN RESTAURAR
                            <Button 
                                variant="contained" 
                                size="small"
                                onClick={() => handleRestoreStation(params.row.IdEst)}
                                startIcon={<RestoreFromTrashIcon 
                                    sx={{
                                        color: '#fff !important',
                                    }}
                                />}
                                sx={{ 
                                    backgroundColor: '#1976d2', 
                                    color: '#fff !important', 
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    padding: '4px 10px',
                                    borderRadius: '6px'
                                }}
                            >
                                Restaurar
                            </Button>
                        )}
                    </Box>
                );
            },
        },
    ];

    return (
        <Box sx={{ width: '100%', pb: 4 }}>

            {/* 1. Encabezado */}
            <Box
                sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 3,
                    backgroundColor: 'var(--card-bg)', borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)',
                    transition: 'background-color 0.3s ease'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: '12px', backgroundColor: 'rgba(255, 193, 7, 0.1)', display: 'flex' }}>
                        <EvStationIcon sx={{ color: '#FFC107', fontSize: '2rem' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
                            Gestión de Estaciones
                        </Typography>
                    </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                    {/* Switch Mostrar Eliminados */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showDeleted}
                                onChange={(e) => setShowDeleted(e.target.checked)}
                                color="warning"
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ color: 'var(--text-color)', fontWeight: 500 }}>
                                Mostrar Eliminados
                            </Typography>
                        }
                        sx={{ mr: 1 }}
                    />

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{
                            fontWeight: 'bold', borderRadius: '10px', px: 3, py: 1,
                            backgroundColor: '#004F8C', color: '#fff',
                            boxShadow: '0 0 10px rgba(0, 119, 209, 0.5)', transition: 'all 0.3s ease',
                            '&:hover': { backgroundColor: '#005ea8', boxShadow: '0 0 20px rgba(0, 119, 209, 0.8)', transform: 'scale(1.05)' },
                        }}
                    >
                        Agregar Estación
                    </Button>
                </Box>
            </Box>

            {/* 2. Tabla */}
            <Paper
                sx={{
                    flexGrow: 1, width: '100%', borderRadius: '16px', overflow: 'hidden',
                    backgroundColor: 'var(--card-bg)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid var(--border-color)', transition: 'background-color 0.3s ease'
                }}
            >
                <DataGrid
                    rows={estaciones}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.IdEst}
                    slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                    autoHeight={estaciones.length === 0}
                    // Estilo condicional
                    getRowClassName={(params) => 
                        params.row.activo === false || params.row.activo === 0 ? 'fila-inactiva' : ''
                    }
                    sx={{
                        border: 'none', color: 'var(--text-color)', minHeight: 400,
                        '& .MuiDataGrid-columnHeaders': { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' },
                        '& .MuiDataGrid-cell': { borderBottom: '1px solid var(--border-color)' },
                        '& .MuiDataGrid-footerContainer': { backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)' },
                        '& .MuiTablePagination-root': { color: 'var(--text-color)' },
                        '& .MuiSvgIcon-root': { color: 'var(--text-color)' },
                        // Estilo visual para distinguir eliminados
                        '& .fila-inactiva': {
                            backgroundColor: 'rgba(255, 0, 0, 0.05)',
                            color: '#999',
                            '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                        }
                    }}
                />
            </Paper>

            {/* 3. Modales */}
            <EstacionFormModal open={isModalOpen} onClose={handleCloseModal} onSaveSuccess={fetchEstaciones} estacionToEdit={currentEstacion} />

            <Dialog open={confirmOpen} onClose={handleCloseConfirm} PaperProps={{ sx: { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' } }}>
                <DialogTitle sx={{ fontWeight: 'bold', color: '#F87171', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon /> Confirmar Eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-color)', opacity: 0.8 }}>
                        ¿Estás seguro de que deseas desactivar la estación <strong style={{ color: '#004F8C' }}>{stationToDelete?.Nombre}</strong> (ID: {stationToDelete?.IdEst})?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleCloseConfirm} sx={{ color: 'var(--text-color)', opacity: 0.7, textTransform: 'none', mr: 1, '&:hover': { opacity: 1, backgroundColor: 'transparent' } }}>Cancelar</Button>
                    <Button onClick={handleDeleteStation} variant="contained" sx={{ backgroundColor: '#EF4444', color: '#fff', fontWeight: 'bold', borderRadius: '8px', textTransform: 'none', boxShadow: '0 4px 10px rgba(239,68,68,0.4)', '&:hover': { backgroundColor: '#DC2626' } }} autoFocus>Desactivar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EstacionesPage;