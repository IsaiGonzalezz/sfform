import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Checkbox,
    FormControlLabel, Switch // <--- Para el switch
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'; // <--- Icono Restaurar
import GroupIcon from '@mui/icons-material/Group';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    
    // NUEVO: Estado para mostrar eliminados
    const [showDeleted, setShowDeleted] = useState(false);

    // --- Función READ (Usuarios) ---
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            // Lógica del filtro: Si showDeleted es true, pedimos ?verTodos=true
            const url = showDeleted 
                ? `${API_URL_REL}?verTodos=true` 
                : API_URL_REL;

            const response = await axiosInstance.get(url);
            setUsers(response.data || []);
        } catch (error) {
            console.error("Hubo un error al obtener los usuarios:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, showDeleted]); // <--- Dependencia showDeleted

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- Función DELETE (Desactivar) ---
    // --- Función DELETE (Desactivar / Soft Delete) ---
    const handleDeleteUser = async () => {
        if (!userToDelete) return; 

        try {
            // CORRECCIÓN: patch(URL, DATOS)
            // Enviamos activo: 0 (o false) para que el backend sepa qué cambiar
            await axiosInstance.patch(`${API_URL_REL}${userToDelete.id}`, {
                activo: 0 
            });

            console.log('Usuario desactivado exitosamente:', userToDelete.id);
            fetchUsers(); // Recargamos la tabla
        } catch (error) {
            console.error('Hubo un error al desactivar el usuario:', error.response?.data || error.message);
        } finally {
            handleCloseConfirm(); 
        }
    };

    // --- NUEVO: Función RESTAURAR (Activar) ---
    const handleRestoreUser = async (id) => {
        if (!window.confirm("¿Deseas restaurar este usuario?")) return;
        try {
            // Ajusta la ruta si tu backend usa /activar/ o un PATCH directo
            await axiosInstance.put(`${API_URL_REL}activar/${id}`);
            fetchUsers(); // Recargamos la tabla
        } catch (error) {
            console.error("Error al restaurar:", error);
            alert("No se pudo restaurar el usuario.");
        }
    };

    // --- Handlers Modales ---
    const handleOpenModal = (user = null) => { setCurrentUser(user); setModalOpen(true); };
    const handleCloseModal = () => { setModalOpen(false); setCurrentUser(null); };
    const handleOpenConfirm = (user) => { setUserToDelete(user); setConfirmOpen(true); };
    const handleCloseConfirm = () => { setConfirmOpen(false); setUserToDelete(null); };

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
                                onClick={() => handleRestoreUser(params.row.id)}
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
                    getRowId={(row) => row.id} // <--- OJO: En usuarios suele ser 'id', no 'rfid' (ajusta si es necesario)
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

            {/* Modales */}
            <UserFormModal open={isModalOpen} onClose={handleCloseModal} onSaveSuccess={fetchUsers} userToEdit={currentUser} />
            
            <Dialog open={confirmOpen} onClose={handleCloseConfirm} PaperProps={{ sx: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderRadius: '12px', boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' } }}>
                <DialogTitle sx={{ fontWeight: 'bold', color: '#F87171', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon /> Confirmar Desactivación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-color)' }}>
                        ¿Estás seguro de que deseas desactivar al usuario <strong style={{ color: '#60A5FA' }}>{userToDelete?.nombre}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseConfirm} sx={{ color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', textTransform: 'none' }}>Cancelar</Button>
                    <Button onClick={handleDeleteUser} sx={{ color: '#fff', backgroundColor: '#EF4444', fontWeight: 'bold', borderRadius: '8px', px: 2, textTransform: 'none', '&:hover': { backgroundColor: '#DC2626' } }} autoFocus>Desactivar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default UsersPage;