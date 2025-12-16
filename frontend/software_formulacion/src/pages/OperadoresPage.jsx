import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Checkbox,
    FormControlLabel, Switch // <--- NUEVO
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'; 
import BadgeIcon from '@mui/icons-material/Badge';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OperadorFormModal from '../components/OperadorFormModal';

// URLs RELATIVAS
const API_URL_OPERADORES_REL = '/operadores/';
const API_URL_ESTACIONES_REL = '/estaciones/';

// Componente para tabla vacía (sin cambios)
function CustomNoRowsOverlay() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <InfoOutlinedIcon sx={{ fontSize: 48, color: 'grey.500' }} />
            <Typography variant="h6" sx={{ mt: 1, color: 'grey.500' }}>No hay operadores</Typography>
        </Box>
    );
}

function OperadoresPage() {
    const { axiosInstance } = useAuth();

    // --- Estados ---
    const [operadores, setOperadores] = useState([]);
    const [estaciones, setEstaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentOperador, setCurrentOperador] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [operadorToDelete, setOperadorToDelete] = useState(null);
    
    // NUEVO: Estado para mostrar eliminados
    const [showDeleted, setShowDeleted] = useState(false); 

    // --- Función READ (Operadores) ---
    const fetchOperadores = useCallback(async () => {
        setLoading(true);
        try {
            // LÓGICA DEL FILTRO: Si showDeleted es true, pedimos verTodos
            const url = showDeleted 
                ? `${API_URL_OPERADORES_REL}?verTodos=true` 
                : API_URL_OPERADORES_REL;

            const response = await axiosInstance.get(url);
            setOperadores(response.data || []);
        } catch (error) {
            console.error("Error al obtener los operadores:", error);
            setOperadores([]);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, showDeleted]); // <--- Dependencia showDeleted agregada

    // --- Función READ (Estaciones) ---
    const fetchEstaciones = useCallback(async () => {
        try {
            const response = await axiosInstance.get(API_URL_ESTACIONES_REL);
            setEstaciones(response.data.map(est => ({ id: est.IdEst, nombre: est.Nombre })) || []);
        } catch (error) {
            console.error("Error al obtener estaciones:", error);
            setEstaciones([]);
        }
    }, [axiosInstance]);

    useEffect(() => {
        fetchOperadores();
        fetchEstaciones();
    }, [fetchOperadores, fetchEstaciones]);

    // --- Función DELETE (Desactivar) ---
    const handleDeleteOperador = async () => {
        if (!operadorToDelete) return;
        try {
            // Usamos PATCH si tu backend espera body parcial, o DELETE si así lo configuraste.
            // En tu código anterior usabas PATCH con activo: false.
            // Si cambiaste a DELETE en el backend, usa .delete(). 
            // Voy a mantener DELETE por consistencia con tu backend nuevo que usa deleteOperador (soft delete)
            await axiosInstance.delete(`${API_URL_OPERADORES_REL}${operadorToDelete.rfid}`);
            
            fetchOperadores(); 
        } catch (error) {
            console.error('Error al desactivar:', error);
        } finally {
            handleCloseConfirm();
        }
    };

    // --- NUEVO: Función RESTAURAR (Activar) ---
    const handleRestoreOperador = async (rfid) => {
        if (!window.confirm("¿Deseas restaurar este operador?")) return;
        try {
            await axiosInstance.put(`${API_URL_OPERADORES_REL}activar/${rfid}`);
            fetchOperadores(); // Recargamos la tabla
        } catch (error) {
            console.error("Error al restaurar:", error);
            alert("No se pudo restaurar el operador.");
        }
    };

    // --- Handlers Modales ---
    const handleOpenModal = (operador = null) => { setCurrentOperador(operador); setModalOpen(true); };
    const handleCloseModal = () => { setModalOpen(false); setCurrentOperador(null); };
    const handleOpenConfirm = (operador) => { setOperadorToDelete(operador); setConfirmOpen(true); };
    const handleCloseConfirm = () => { setConfirmOpen(false); setOperadorToDelete(null); };

    // --- Definición de Columnas ---
    const columns = [
        { field: 'rfid', headerName: 'RFID', width: 150 },
        { field: 'nombre', headerName: 'Nombre Operador', flex: 1 },
        { field: 'idest', headerName: 'ID Estación', width: 200 },
        {
            field: 'activo', headerName: 'Estatus', width: 100,
            renderCell: (params) => (
                // Usamos el Checkbox pero visualmente informativo
                <Checkbox checked={Boolean(params.value)} disabled size="small" 
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
                const isActive = params.row.activo; // Checamos si está activo (1) o inactivo (0)

                return (
                    <Box display="flex" gap={1} alignItems="center" height="100%">
                        {isActive ? ( 
                            // ACCIONES NORMALES (Editar / Borrar)
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
                            // ACCIÓN RESTAURAR (Solo visible si está eliminado)
                            <Button 
                                variant="contained" 
                                size="small"
                                onClick={() => handleRestoreOperador(params.row.rfid)}
                                startIcon={<RestoreFromTrashIcon />}
                                sx={{ 
                                    backgroundColor: '#1976d2', 
                                    color: '#fff', 
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    padding: '4px 10px'
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
            {/* Encabezado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, background: 'var(--bg-color)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon sx={{ color: '#FF9800', fontSize: '2rem' }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'var(--text-color)', letterSpacing: '0.5px' }}>
                        Gestión de Operadores
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                    {/* NUEVO: Switch para mostrar eliminados */}
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

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{ fontWeight: 'bold', borderRadius: '10px', px: 3, py: 1, backgroundColor: '#004F8C', color: '#fff', boxShadow: '0 0 10px rgba(0, 119, 209, 0.5)', transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#005ea8', boxShadow: '0 0 20px rgba(0, 119, 209, 0.8)', transform: 'scale(1.05)' } }}
                    >
                        Agregar Operador
                    </Button>
                </Box>
            </Box>

            {/* Tabla */}
            <Paper sx={{ flexGrow: 1, width: '100%', borderRadius: '14px', overflow: 'hidden', backgroundColor: 'var(--bg-color)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
                <DataGrid
                    rows={operadores}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.rfid}
                    slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                    autoHeight={operadores.length === 0}
                    // Estilo condicional para filas inactivas (opcional pero recomendado)
                    getRowClassName={(params) => 
                        params.row.activo === false || params.row.activo === 0 ? 'fila-inactiva' : ''
                    }
                    sx={{
                        border: 'none', color: 'var(--text-color)',
                        '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                        '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(255,255,255,0.08)' },
                        '& .MuiDataGrid-footerContainer': { backgroundColor: 'var(--bg-color)', borderTop: '1px solid rgba(255,255,255,0.1)' },
                        // Estilo visual para distinguir eliminados
                        '& .fila-inactiva': {
                            backgroundColor: 'rgba(255, 0, 0, 0.05)',
                            color: '#999',
                            '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                        }
                    }}
                />
            </Paper>

            {/* Modales (Sin cambios) */}
            <OperadorFormModal open={isModalOpen} onClose={handleCloseModal} onSaveSuccess={fetchOperadores} operadorToEdit={currentOperador} estacionesList={estaciones} />
            
            <Dialog open={confirmOpen} onClose={handleCloseConfirm} PaperProps={{ sx: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderRadius: '12px', boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' } }}>
                <DialogTitle sx={{ fontWeight: 'bold', color: '#F87171', display: 'flex', alignItems: 'center', gap: 1 }}><WarningAmberIcon /> Confirmar Desactivación</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-color)' }}>
                        ¿Estás seguro de desactivar a <strong style={{ color: '#60A5FA' }}>{operadorToDelete?.nombre}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseConfirm} sx={{ color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', textTransform: 'none' }}>Cancelar</Button>
                    <Button onClick={handleDeleteOperador} sx={{ color: '#fff', backgroundColor: '#EF4444', fontWeight: 'bold', borderRadius: '8px', px: 2, textTransform: 'none', '&:hover': { backgroundColor: '#DC2626' } }} autoFocus>Desactivar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default OperadoresPage;