import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Checkbox // Import Checkbox
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceIcon from '@mui/icons-material/Science'; // Icono para Ingredientes
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import IngredienteFormModal from '../components/IngredienteFormModal'; // Crearemos/Actualizaremos este

const API_URL_INGREDIENTES = 'http://127.0.0.1:8000/api/ingredientes/';
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#11998e' },
        background: { paper: '#1e1e1e' },
    },
});

// Overlay Tabla Vacía (Adaptado)
function CustomNoRowsOverlay() {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
        }}>
            <ScienceIcon sx={{ fontSize: 48, color: 'grey.500' }} />
            <Typography variant="h6" sx={{ mt: 1, color: 'grey.500' }}>
                No hay ingredientes</Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
                Agrega uno nuevo para comenzar
            </Typography>
        </Box>);
}

function IngredientesPage() {
    const [ingredientes, setIngredientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentIngrediente, setCurrentIngrediente] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [ingredienteToDelete, setIngredienteToDelete] = useState(null);

    const fetchIngredientes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL_INGREDIENTES);
            setIngredientes(response.data);
        } catch (error) {
            console.error("Error al obtener las estaciones:", error);
            setIngredientes([]);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchIngredientes();
    }, [fetchIngredientes]);


    const handleOpenModal = (ing = null) => {
        setCurrentIngrediente(ing);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentIngrediente(null);
    };

    const handleOpenConfirm = (ing) => {
        setIngredienteToDelete(ing);
        setConfirmOpen(true);
    };

    const handleCloseConfirm = () => {
        setConfirmOpen(false);
        setIngredienteToDelete(null);
    };

    const handleDeleteIngrediente = async () => {
        if (!ingredienteToDelete) return;
        try {
            await axios.delete(`${API_URL_INGREDIENTES}${ingredienteToDelete.iding}/`);
            fetchIngredientes();
        } catch (error) { console.error('Error al borrar ingrediente:', error); }
        finally { handleCloseConfirm(); }
    };

    const columns = [
        { field: 'iding', headerName: 'ID Ingrediente', width: 150 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'presentacion', headerName: 'Presentación', width: 200 },
        { field: 'observaciones', headerName: 'Observaciones', width: 250 },
        {
            field: 'pesado',
            headerName: 'Pesado',
            width: 100,
            renderCell: (params) => ( // Renderizar un Checkbox
                <Checkbox checked={Boolean(params.value)} disabled size="small" />
            ),
        },
        {
            field: 'actions', headerName: 'Acciones', width: 120, sortable: false, disableColumnMenu: true,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenModal(params.row)} sx={{ color: '#38ef7d' }}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleOpenConfirm(params.row)} sx={{ color: '#ff6b6b' }}><DeleteOutlineIcon /></IconButton>
                </Box>
            ),
        },
    ];

    return (
        <>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3, // Incrementado margen inferior
                p: 2,
                background: '#292929FF', // Fondo
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', // Sombra
            }}>
                <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    
                }}>
                    <ScienceIcon sx={{ color: '#60A5FA', fontSize: '2rem' }} />
                    <Typography variant="h4" component="h1" 
                    sx={{
                        fontWeight: 'bold',
                        color: '#E0E0E0',
                        letterSpacing: '0.5px',
                    }}>Gestión de Ingredientes</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} 
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
                    Agregar Ingrediente
                </Button>
            </Box>

            {/* Tabla (Adaptada) */}
            <ThemeProvider theme={darkTheme}>
                <Paper sx={{ /* ... estilos del Paper ... */ }}>
                    <DataGrid
                        rows={ingredientes}
                        columns={columns}
                        loading={loading}
                        getRowId={(row) => row.iding} // Usar iding
                        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                        autoHeight={ingredientes.length === 0}
                        sx={{ /* ... estilos DataGrid ... */ }}
                    />
                </Paper>

                {/* Modal Crear/Editar */}
                <IngredienteFormModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSaveSuccess={fetchIngredientes}
                    ingredienteToEdit={currentIngrediente}
                />

                {/* Modal Confirmación Borrar (Adaptado) */}
                <Dialog open={confirmOpen} onClose={handleCloseConfirm} PaperProps={{ /* ... */ }}>
                    <DialogTitle sx={{ /* ... */ }}><WarningAmberIcon /> Confirmar Eliminación</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ color: '#D1D5DB' }}>
                            ¿Estás seguro de que deseas eliminar el ingrediente
                            <strong style={{ color: '#60A5FA' }}> {ingredienteToDelete?.nombre}</strong>?
                            Esta acción no se puede deshacer.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ /* ... */ }}>
                        <Button onClick={handleCloseConfirm} sx={{ /* ... */ }}>Cancelar</Button>
                        <Button onClick={handleDeleteIngrediente} sx={{ /* ... estilos botón rojo ... */ }} autoFocus>Eliminar</Button>
                    </DialogActions>
                </Dialog>
            </ThemeProvider>
        </>
    );
}

export default IngredientesPage;