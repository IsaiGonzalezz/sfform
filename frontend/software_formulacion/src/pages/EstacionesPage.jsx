import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import {
    Box, Typography, Button, Paper, IconButton,
    Checkbox, FormControlLabel, Switch
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import EvStationIcon from '@mui/icons-material/EvStation';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { AlertCircle, Check } from 'lucide-react'; // Iconos para el Toast

import EstacionFormModal from '../components/EstacionFormModal';

const API_URL_ESTACIONES_REL = '/estaciones/';

// --- Componente para tabla vacía ---
function CustomNoRowsOverlay() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-color)', opacity: 0.6 }}>
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
    
    // Modales de Edición/Creación
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [currentEstacion, setCurrentEstacion] = useState(null);

    // Estado Switch Filtro
    const [showDeleted, setShowDeleted] = useState(false);

    // --- ESTADO TOAST ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- HELPER: Mostrar Toast ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // --- ESTADOS PARA CONFIRM MODAL (MANUAL) ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        color: '#ef4444', // Rojo por defecto
        confirmText: '',
        onConfirm: () => {}
    });

    // --- Fetch Estaciones ---
    const fetchEstaciones = useCallback(async () => {
        setLoading(true);
        try {
            const url = showDeleted 
                ? `${API_URL_ESTACIONES_REL}?verTodos=true` 
                : API_URL_ESTACIONES_REL;

            const response = await axiosInstance.get(url);
            setEstaciones(response.data || []);
        } catch (error) {
            console.error("Error al obtener las estaciones:", error);
            showToast("Error al cargar estaciones", "error");
            setEstaciones([]);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, showDeleted]);

    useEffect(() => {
        fetchEstaciones();
    }, [fetchEstaciones]);

    // --- Manejadores de Modal Formulario ---
    const handleOpenFormModal = (estacion = null) => { setCurrentEstacion(estacion); setFormModalOpen(true); };
    const handleCloseFormModal = () => { setFormModalOpen(false); setCurrentEstacion(null); };

    // --- LÓGICA DE ACCIONES (Desactivar / Restaurar) ---

    // 1. DESACTIVAR (Borrar)
    const handleDeleteClick = (station) => {
        setModalConfig({
            title: 'Confirmar Desactivación',
            message: (
                <>
                    ¿Estás seguro de que deseas desactivar la estación <strong>{station.Nombre}</strong>?
                    <br />Esta acción la ocultará de la lista principal.
                </>
            ),
            color: '#ef4444', // Rojo
            confirmText: 'Desactivar',
            onConfirm: async () => {
                try {
                    await axiosInstance.patch(`${API_URL_ESTACIONES_REL}${station.IdEst}`);
                    showToast(`Estación ${station.Nombre} desactivada`, 'success');
                    fetchEstaciones();
                } catch (error) {
                    console.error('Error al desactivar:', error);
                    showToast('Error al desactivar', 'error');
                }
            }
        });
        setShowConfirmModal(true);
    };

    // 2. RESTAURAR (Activar)
    const handleRestoreClick = (stationId) => {
        setModalConfig({
            title: 'Confirmar Restauración',
            message: '¿Deseas restaurar esta estación para que vuelva a estar activa?',
            color: '#3b82f6', // Azul
            confirmText: 'Restaurar',
            onConfirm: async () => {
                try {
                    await axiosInstance.put(`${API_URL_ESTACIONES_REL}activar/${stationId}`);
                    showToast('Estación restaurada exitosamente', 'success');
                    fetchEstaciones();
                } catch (error) {
                    console.error("Error al restaurar:", error);
                    showToast("No se pudo restaurar la estación", "error");
                }
            }
        });
        setShowConfirmModal(true);
    };

    // Función para ejecutar la acción confirmada
    const handleConfirmAction = () => {
        modalConfig.onConfirm();
        setShowConfirmModal(false);
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
                                <IconButton onClick={() => handleOpenFormModal(params.row)}
                                    sx={{ backgroundColor: '#229D1B', borderRadius: '8px', padding: '6px', '&:hover': { backgroundColor: '#1b8016' } }}>
                                    <EditIcon sx={{ fontSize: '20px',color: '#ffffff !important' }} />
                                </IconButton>
                                <IconButton onClick={() => handleDeleteClick(params.row)}
                                    sx={{ backgroundColor: '#9D1B1B', color: 'var(--text-color)', borderRadius: '8px', padding: '6px', '&:hover': { backgroundColor: '#7a1515' } }}>
                                    <DeleteOutlineIcon sx={{ fontSize: '20px', color: '#ffffff !important' }} />
                                </IconButton>
                            </>
                        ) : (
                            // ACCIÓN RESTAURAR
                            <Button 
                                variant="contained" 
                                size="small"
                                onClick={() => handleRestoreClick(params.row.IdEst)}
                                startIcon={<RestoreFromTrashIcon sx={{ color: '#fff !important' }} />}
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
        <Box sx={{ width: '100%', pb: 4, position: 'relative' }}>

            {/* --- TOAST COMPONENT --- */}
            {toast.show && (
                <div style={{
                    ...customStyles.toast,
                    backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: toast.type === 'error' ? '#991b1b' : '#15803d',
                    borderColor: toast.type === 'error' ? '#fecaca' : '#bbf7d0',
                }}>
                    <div style={{
                        ...customStyles.toastIconContainer,
                        backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e',
                    }}>
                        {toast.type === 'error' ? <AlertCircle size={16} color="#fff" /> : <Check size={16} color="#fff" strokeWidth={3} />}
                    </div>
                    {toast.message}
                </div>
            )}

            {/* --- MODAL CONFIRMACIÓN (DISEÑO IOS MANUAL) --- */}
            {showConfirmModal && (
                <div style={customStyles.modalOverlay}>
                    <div style={customStyles.iosModal}>
                        <div style={customStyles.iosModalContent}>
                            <h3 style={customStyles.iosTitle}>{modalConfig.title}</h3>
                            <div style={customStyles.iosMessage}>
                                {modalConfig.message}
                            </div>
                        </div>
                        <div style={customStyles.iosActionGroup}>
                            <button
                                style={customStyles.iosButtonCancel}
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                style={{ ...customStyles.iosButtonConfirm, color: modalConfig.color }}
                                onClick={handleConfirmAction}
                            >
                                {modalConfig.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        onClick={() => handleOpenFormModal()}
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
                        '& .fila-inactiva': {
                            backgroundColor: 'rgba(255, 0, 0, 0.05)',
                            color: '#999',
                            '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                        }
                    }}
                />
            </Paper>

            {/* 3. Modales */}
            <EstacionFormModal 
                open={isFormModalOpen} 
                onClose={handleCloseFormModal} 
                onSaveSuccess={() => {
                    fetchEstaciones();
                    showToast(currentEstacion ? 'Estación editada correctamente' : 'Estación creada correctamente');
                }} 
                estacionToEdit={currentEstacion} 
            />

        </Box>
    );
}

// --- ESTILOS PERSONALIZADOS (TOAST & MODAL IOS) ---
const customStyles = {
    toast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: '600',
        fontSize: '0.95rem',
        zIndex: 9999,
        border: '1px solid',
        animation: 'slideIn 0.3s ease-out'
    },
    toastIconContainer: {
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out'
    },
    iosModal: {
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-color)',
        width: '85%',
        maxWidth: '320px',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        textAlign: 'center',
        animation: 'scaleUp 0.2s ease-out',
        border: '1px solid var(--border-color)'
    },
    iosModalContent: {
        padding: '24px 20px 20px 20px',
    },
    iosTitle: {
        margin: '0 0 10px 0',
        fontSize: '1.2rem',
        fontWeight: '700',
    },
    iosMessage: {
        margin: 0,
        fontSize: '0.95rem',
        opacity: 0.8,
        lineHeight: 1.4
    },
    iosActionGroup: {
        display: 'flex',
        borderTop: '1px solid var(--border-color)',
    },
    iosButtonCancel: {
        flex: 1,
        padding: '16px',
        background: 'transparent',
        border: 'none',
        borderRight: '1px solid var(--border-color)',
        color: 'var(--text-color)', 
        opacity: 0.7,
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
    },
    iosButtonConfirm: {
        flex: 1,
        padding: '16px',
        background: 'transparent',
        border: 'none',
        fontWeight: '700',
        fontSize: '1rem',
        cursor: 'pointer',
    }
};

export default EstacionesPage;