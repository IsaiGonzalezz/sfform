import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Checkbox,
    FormControlLabel, Switch // <--- 1. Importamos Switch
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'; // <--- 2. Icono Restaurar
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import IngredienteFormModal from '../components/IngredienteFormModal';

// URL RELATIVA
const API_URL_INGREDIENTES_REL = '/ingredientes/';

// Overlay Tabla Vacía
function CustomNoRowsOverlay() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <ScienceIcon sx={{ fontSize: 48, color: 'grey.500' }} />
            <Typography variant="h6" sx={{ mt: 1, color: 'grey.500' }}>No hay ingredientes</Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>Agrega uno nuevo para comenzar</Typography>
        </Box>
    );
}

function IngredientesPage() {
    const { axiosInstance } = useAuth();

    // --- Estados ---
    const [ingredientes, setIngredientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentIngrediente, setCurrentIngrediente] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [ingredienteToDelete, setIngredienteToDelete] = useState(null);
    
    // NUEVO: Estado para el Switch
    const [showDeleted, setShowDeleted] = useState(false);

    // --- Función READ (Petición GET) ---
    const fetchIngredientes = useCallback(async () => {
        setLoading(true);
        try {
            // Lógica del filtro: Si showDeleted es true, pedimos ?verTodos=true
            const url = showDeleted 
                ? `${API_URL_INGREDIENTES_REL}?verTodos=true` 
                : API_URL_INGREDIENTES_REL;

            const response = await axiosInstance.get(url);
            setIngredientes(response.data || []);
        } catch (error) {
            console.error("Error al obtener los ingredientes:", error);
            setIngredientes([]);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, showDeleted]); // <--- Dependencia showDeleted agregada

    useEffect(() => {
        if (axiosInstance) {
            fetchIngredientes();
        }
    }, [fetchIngredientes, axiosInstance]);

    // --- Función DELETE (Desactivar) ---
    const handleDeleteIngrediente = async () => {
        if (!ingredienteToDelete) return;
        try {
            // Usamos DELETE para coincidir con el soft-delete del backend
            await axiosInstance.delete(`${API_URL_INGREDIENTES_REL}${ingredienteToDelete.iding}`);
            fetchIngredientes();
        } catch (error) {
            console.error('Error al desactivar ingrediente:', error);
        } finally {
            handleCloseConfirm();
        }
    };

    // --- NUEVO: Función RESTAURAR (Activar) ---
    const handleRestoreIngrediente = async (id) => {
        if (!window.confirm("¿Deseas restaurar este ingrediente?")) return;
        try {
            // Llamamos a la ruta /activar/ del backend
            await axiosInstance.put(`${API_URL_INGREDIENTES_REL}activar/${id}`);
            fetchIngredientes(); // Recargar tabla
        } catch (error) {
            console.error("Error al restaurar:", error);
            alert("No se pudo restaurar el ingrediente.");
        }
    };

    // --- Funciones Modales ---
    const handleOpenModal = (ing = null) => { setCurrentIngrediente(ing); setModalOpen(true); };
    const handleCloseModal = () => { setModalOpen(false); setCurrentIngrediente(null); };
    const handleOpenConfirm = (ing) => { setIngredienteToDelete(ing); setConfirmOpen(true); };
    const handleCloseConfirm = () => { setConfirmOpen(false); setIngredienteToDelete(null); };

    // --- Columnas de la Tabla ---
    const columns = [
        { field: 'iding', headerName: 'ID', width: 100 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'presentacion', headerName: 'Presentación', width: 150 },
        { field: 'observaciones', headerName: 'Observaciones', width: 250 },
        {
            field: 'pesado', headerName: 'Pesado', width: 100,
            renderCell: (params) => (
                <Checkbox checked={Boolean(params.value)} disabled size="small" />
            ),
        },
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
                                    sx={{ backgroundColor: '#229D1B', color: '#fff', borderRadius: '8px', padding: '6px', '&:hover': { backgroundColor: '#1b8016' } }}>
                                    <EditIcon sx={{ fontSize: '20px' }} />
                                </IconButton>
                                <IconButton onClick={() => handleOpenConfirm(params.row)} 
                                    sx={{ backgroundColor: '#9D1B1B', color: '#fff', borderRadius: '8px', padding: '6px', '&:hover': { backgroundColor: '#7a1515' } }}>
                                    <DeleteOutlineIcon sx={{ fontSize: '20px' }} />
                                </IconButton>
                            </>
                        ) : (
                            // ACCIÓN RESTAURAR
                            <Button 
                                variant="contained" 
                                size="small"
                                onClick={() => handleRestoreIngrediente(params.row.iding)}
                                startIcon={<RestoreFromTrashIcon />}
                                sx={{ 
                                    backgroundColor: '#1976d2', 
                                    color: '#fff', 
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
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, background: 'var(--bg-color)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceIcon sx={{ color: '#60A5FA', fontSize: '2rem' }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'var(--text-color)', letterSpacing: '0.5px' }}>
                        Gestión de Ingredientes
                    </Typography>
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
                        sx={{ mr: 2 }}
                    />

                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}
                        sx={{ fontWeight: 'bold', borderRadius: '10px', px: 3, py: 1, backgroundColor: '#004F8C', color: '#fff', boxShadow: '0 0 10px rgba(0, 119, 209, 0.5)', transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#005ea8', boxShadow: '0 0 20px rgba(0, 119, 209, 0.8)', transform: 'scale(1.05)' } }}>
                        Agregar Ingrediente
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ flexGrow: 1, width: '100%', borderRadius: '14px', overflow: 'hidden', backgroundColor: 'var(--bg-color)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
                <DataGrid
                    rows={ingredientes}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.iding}
                    slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                    autoHeight={ingredientes.length === 0}
                    // Estilo condicional para filas eliminadas
                    getRowClassName={(params) => 
                        params.row.activo === false || params.row.activo === 0 ? 'fila-inactiva' : ''
                    }
                    sx={{
                        border: 'none', color: 'var(--text-color)',
                        '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(90deg, #292929, #292929)', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                        '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(255,255,255,0.08)' },
                        '& .MuiDataGrid-footerContainer': { backgroundColor: 'var(--bg-color)', borderTop: '1px solid rgba(255,255,255,0.1)' },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { width: '8px' },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': { background: '#1E293B' },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { backgroundColor: '#4B5563', borderRadius: '4px' },
                        // Estilo visual para distinguir eliminados
                        '& .fila-inactiva': {
                            backgroundColor: 'rgba(255, 0, 0, 0.05)',
                            color: '#999',
                            '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                        }
                    }}
                />
            </Paper>

            <IngredienteFormModal open={isModalOpen} onClose={handleCloseModal} onSaveSuccess={fetchIngredientes} ingredienteToEdit={currentIngrediente} />

            <Dialog open={confirmOpen} onClose={handleCloseConfirm} PaperProps={{ sx: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderRadius: '12px', boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' } }}>
                <DialogTitle sx={{ fontWeight: 'bold', color: '#F87171', display: 'flex', alignItems: 'center', gap: 1 }}><WarningAmberIcon /> Confirmar Desactivación</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-color)' }}>
                        ¿Estás seguro de que deseas desactivar el ingrediente <strong style={{ color: '#60A5FA' }}>{ingredienteToDelete?.nombre}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseConfirm} sx={{ color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', textTransform: 'none' }}>Cancelar</Button>
                    <Button onClick={handleDeleteIngrediente} sx={{ color: '#fff', backgroundColor: '#EF4444', fontWeight: 'bold', borderRadius: '8px', px: 2, textTransform: 'none', '&:hover': { backgroundColor: '#DC2626' } }} autoFocus>Desactivar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default IngredientesPage;