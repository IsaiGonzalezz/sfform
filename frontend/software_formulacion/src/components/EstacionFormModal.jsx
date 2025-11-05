import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, FormHelperText
} from '@mui/material';
import {
    // Tus imports de MUI (asumo que ya tienes los básicos)
    Box,
    InputAdornment
} from '@mui/material';
import { LoadingButton } from '@mui/lab'; // Botón de carga
import {
    // Iconos para el formulario
    Badge, // ID Estación
    WarehouseOutlined, // Nombre Estación
    NotesOutlined, // Observaciones
    AddBusinessOutlined, // Título Agregar
    EditLocationOutlined, // Título Editar
    SaveOutlined, // Guardar
    Close // Cancelar
} from '@mui/icons-material';


// URL de la API para Estaciones
const API_URL_ESTACIONES = 'http://127.0.0.1:8000/api/estaciones/';

// Esquema de Validación para Estaciones
const validationSchema = yup.object().shape({
    idest: yup.string().required('El ID de estación es obligatorio'),
    nombre: yup.string().required('El nombre es obligatorio'),
    obs: yup.string().nullable(), // Observaciones son opcionales
});

function EstacionFormModal({ open, onClose, onSaveSuccess, estacionToEdit }) {

    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = estacionToEdit !== null;

    const { handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: { idest: '', nombre: '', obs: '' }
    });

    useEffect(() => {
        if (open) {
            if (isEditMode && estacionToEdit) {
                reset({
                    idest: estacionToEdit.idest || '',
                    nombre: estacionToEdit.nombre || '',
                    obs: estacionToEdit.obs || '',
                });
            } else {
                reset({ idest: '', nombre: '', obs: '' });
            }
        }
    }, [estacionToEdit, open, reset, isEditMode]);

    // --- Función onSubmit (Crea o Actualiza) ---
    const onSubmit = async (data) => {
        setIsSaving(true);
        let success = false;
        try {
            if (isEditMode) {
                // PUT para actualizar
                await axios.put(`${API_URL_ESTACIONES}${estacionToEdit.idest}/`, data);
            } else {
                // POST para crear
                await axios.post(API_URL_ESTACIONES, data);
            }
            console.log('¡Operación de estación exitosa!');
            success = true;
        } catch (error) {
            console.error('Error al guardar estación:', error.response?.data || error.message);
            success = false;
            // Considera mostrar error al usuario (ej: si el ID ya existe al crear)
        } finally {
            setIsSaving(false);
            if (success) {
                onSaveSuccess(); // Recarga la tabla
                onClose();       // Cierra la modal
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose} // Permite cerrar con clic afuera/escape
            PaperProps={{
                sx: {
                    backgroundColor: '#1e1e1e',
                    color: '#fff',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '500px' // Ancho definido
                }
            }}
        >
            {/* El form usa handleSubmit */}
            <form onSubmit={handleSubmit(onSubmit)}>

                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isEditMode ? <EditLocationOutlined /> : <AddBusinessOutlined />}
                    {isEditMode ? 'Editar Estación' : 'Agregar Nueva Estación'}
                </DialogTitle>

                <DialogContent>
                    {/* Usamos un Box para dar espaciado uniforme */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>

                        {/* --- CAMPO ID ESTACIÓN --- */}
                        <Controller
                            name="idest"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    autoFocus
                                    label="ID Estación"
                                    fullWidth
                                    variant="outlined"
                                    disabled={isSaving || isEditMode} // ID no editable al modificar
                                    error={!!errors.idest}
                                    helperText={errors.idest?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Badge sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: '#bbb' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }}
                                />
                            )}
                        />

                        {/* --- CAMPO NOMBRE ESTACIÓN --- */}
                        <Controller
                            name="nombre"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nombre Estación"
                                    fullWidth
                                    variant="outlined"
                                    disabled={isSaving}
                                    error={!!errors.nombre}
                                    helperText={errors.nombre?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <WarehouseOutlined sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: '#bbb' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }}
                                />
                            )}
                        />

                        {/* --- CAMPO OBSERVACIONES --- */}
                        <Controller
                            name="obs"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Observaciones"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    variant="outlined"
                                    disabled={isSaving}
                                    error={!!errors.obs}
                                    helperText={errors.obs?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ // Alineado arriba
                                                alignItems: 'flex-start',
                                                pt: 1.5
                                            }}>
                                                <NotesOutlined sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: '#bbb' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }}
                                />
                            )}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: '16px 24px 20px' }}>

                    {/* --- BOTÓN CANCELAR --- */}
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="error" // Rojo
                        startIcon={<Close />}
                        disabled={isSaving}
                        sx={{ borderRadius: '8px' }}
                    >
                        Cancelar
                    </Button>

                    {/* --- BOTÓN GUARDAR (CON CARGA) --- */}
                    <LoadingButton // Usando LoadingButton
                        type="submit"
                        loading={isSaving}
                        loadingPosition="start"
                        startIcon={<SaveOutlined />}
                        variant="contained"
                        color="success" // Verde
                        sx={{
                            fontWeight: 'bold',
                            borderRadius: '8px',
                        }}
                    >
                        {isEditMode ? 'Guardar Cambios' : 'Crear Estación'}
                    </LoadingButton>

                </DialogActions>
            </form>
        </Dialog>
    );
}

export default EstacionFormModal;