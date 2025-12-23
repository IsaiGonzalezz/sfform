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
import GroupIcon from '@mui/icons-material/Group';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { AlertCircle, Check } from 'lucide-react'; // Iconos Toast

import UserFormModal from '../components/UserFormModal';

const API_URL_REL = `/usuarios/`;

// Componente para tabla vacía
function CustomNoRowsOverlay() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <InfoOutlinedIcon sx={{ fontSize: 48, color: 'grey.500' }} />
            <Typography variant="h6" sx={{ mt: 1, color: 'grey.500' }}>No hay usuarios</Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>Agrega uno nuevo para comenzar</Typography>
        </Box>
    );
}

function UsersPage() {
    const { axiosInstance } = useAuth();

    // --- Estados ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modales de Edición/Creación
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Estado Switch Filtro
    const [showDeleted, setShowDeleted] = useState(false);

    // --- ESTADO TOAST (Manual) ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- HELPER: Mostrar Toast ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // --- ESTADOS PARA CONFIRM MODAL (Manual iOS Style) ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        color: '#ef4444', // Rojo por defecto
        confirmText: '',
        onConfirm: () => {}
    });

    // --- Función READ (Usuarios) ---
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const url = showDeleted 
                ? `${API_URL_REL}?verTodos=true` 
                : API_URL_REL;

            const response = await axiosInstance.get(url);
            setUsers(response.data || []);
        } catch (error) {
            console.error("Hubo un error al obtener los usuarios:", error);
            showToast("Error al cargar usuarios", "error");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, showDeleted]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- Handlers Modales Form ---
    const handleOpenModal = (user = null) => { setCurrentUser(user); setModalOpen(true); };
    const handleCloseModal = () => { setModalOpen(false); setCurrentUser(null); };

    // --- LÓGICA DE ACCIONES (Desactivar / Restaurar) ---

    // 1. DESACTIVAR (Soft Delete - Patch activo: 0)
    const handleDeleteClick = (user) => {
        setModalConfig({
            title: 'Confirmar Desactivación',
            message: (
                <>
                    ¿Estás seguro de desactivar al usuario <strong>{user.nombre}</strong>?
                    <br />Ya no podrá iniciar sesión en el sistema.
                </>
            ),
            color: '#ef4444', // Rojo
            confirmText: 'Desactivar',
            onConfirm: async () => {
                try {
                    // Patch para desactivar (soft delete)
                    await axiosInstance.patch(`${API_URL_REL}${user.id}`, { activo: 0 });
                    showToast(`Usuario ${user.nombre} desactivado`, 'success');
                    fetchUsers();
                } catch (error) {
                    console.error('Error al desactivar:', error);
                    showToast('Error al desactivar usuario', 'error');
                }
            }
        });
        setShowConfirmModal(true);
    };

    // 2. RESTAURAR (Activar)
    const handleRestoreClick = (userId) => {
        setModalConfig({
            title: 'Confirmar Restauración',
            message: '¿Deseas restaurar este usuario para que pueda acceder nuevamente?',
            color: '#3b82f6', // Azul
            confirmText: 'Restaurar',
            onConfirm: async () => {
                try {
                    await axiosInstance.put(`${API_URL_REL}activar/${userId}`);
                    showToast('Usuario restaurado exitosamente', 'success');
                    fetchUsers();
                } catch (error) {
                    console.error("Error al restaurar:", error);
                    showToast("No se pudo restaurar el usuario", "error");
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


    // --- Definición de Columnas ---
    const columns = [
        { field: 'rfid', headerName: 'RFID', width: 150 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'correo', headerName: 'Correo', width: 200 },
        { field: 'rol', headerName: 'Rol', width: 150 },
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
                                <IconButton onClick={() => handleDeleteClick(params.row)} 
                                    sx={{ backgroundColor: '#9D1B1B', color: '#fff', borderRadius: '8px', padding: '6px', '&:hover': { backgroundColor: '#7a1515' } }}>
                                    <DeleteOutlineIcon sx={{ fontSize: '20px' }} />
                                </IconButton>
                            </>
                        ) : (
                            // ACCIÓN RESTAURAR
                            <Button 
                                variant="contained" 
                                size="small"
                                onClick={() => handleRestoreClick(params.row.id)}
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

            {/* Encabezado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, background: 'var(--bg-color)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon sx={{ color: '#318EFFFF', fontSize: '2rem' }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'var(--text-color)', letterSpacing: '0.5px' }}>
                        Gestión de Usuarios
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

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{ fontWeight: 'bold', borderRadius: '10px', px: 3, py: 1, backgroundColor: '#004F8C', color: '#fff', boxShadow: '0 0 10px rgba(0, 119, 209, 0.5)', transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#005ea8', boxShadow: '0 0 20px rgba(0, 119, 209, 0.8)', transform: 'scale(1.05)' } }}
                    >
                        Agregar Usuario
                    </Button>
                </Box>
            </Box>

            {/* Tabla */}
            <Paper sx={{ flexGrow: 1, width: '100%', borderRadius: '14px', overflow: 'hidden', backgroundColor: 'var(--bg-color)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.id} // ID de usuario
                    slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                    autoHeight={users.length === 0}
                    // Estilo condicional para filas inactivas
                    getRowClassName={(params) => 
                        params.row.activo === false || params.row.activo === 0 ? 'fila-inactiva' : ''
                    }
                    sx={{
                        border: 'none', color: 'var(--text-color)',
                        '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(90deg, #1E293B, #0F172A)', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                        '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(255,255,255,0.08)' },
                        '& .MuiDataGrid-footerContainer': { backgroundColor: 'var(--bg-color)', borderTop: '1px solid rgba(255,255,255,0.1)' },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { width: '8px' },
                        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': { background: '#3B1E1EFF' },
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

            <UserFormModal 
                open={isModalOpen} 
                onClose={handleCloseModal} 
                onSaveSuccess={() => {
                    fetchUsers();
                    showToast(currentUser ? 'Usuario editado correctamente' : 'Usuario creado correctamente');
                }} 
                userToEdit={currentUser} 
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

export default UsersPage;