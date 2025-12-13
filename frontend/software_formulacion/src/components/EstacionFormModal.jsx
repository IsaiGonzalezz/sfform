import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, FormHelperText, Checkbox, FormControlLabel
} from '@mui/material';
import {
    Box,
    InputAdornment
} from '@mui/material';
import { LoadingButton } from '@mui/lab'; // Botón de carga
import {
    Badge, // ID Estación
    WarehouseOutlined, // Nombre Estación
    NotesOutlined, // Observaciones
    AddBusinessOutlined, // Título Agregar
    EditLocationOutlined, // Título Editar
    SaveOutlined, // Guardar
    Close // Cancelar
} from '@mui/icons-material';


// URL de la API para Estaciones
const API_URL_ESTACIONES_REL = '/estaciones/';

// Esquema de Validación para Estaciones
const validationSchema = yup.object().shape({
    idest: yup.string().required('El ID de estación es obligatorio'),
    nombre: yup.string().required('El nombre es obligatorio'),
    obs: yup.string().nullable(),
    activo: yup.boolean()
});

function EstacionFormModal({ open, onClose, onSaveSuccess, estacionToEdit }) {

    const { axiosInstance } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = estacionToEdit !== null;

    const { handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: { idest: '', nombre: '', obs: '', activo: true }
    });

    useEffect(() => {
        if (open) {
            if (isEditMode && estacionToEdit) {
                reset({
                    idest: estacionToEdit.IdEst || '',
                    nombre: estacionToEdit.Nombre || '',
                    obs: estacionToEdit.Obs || '',
                    activo: Boolean(estacionToEdit.activo)
                });
            } else {
                reset({ idest: '', nombre: '', obs: '', activo: false });
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
                await axiosInstance.put(`${API_URL_ESTACIONES_REL}${estacionToEdit.IdEst}/`, data);
            } else {
                // POST para crear
                await axiosInstance.post(API_URL_ESTACIONES_REL, data);
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
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '500px'
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
                                    error={!!errors.IdEst}
                                    helperText={errors.IdEst?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Badge sx={{ color: 'var(--text-color)' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: 'var(--text-color)' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: 'var(--text-color)', '& fieldset': { borderColor: 'var(--border-color)' } } }}
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
                                    error={!!errors.Nombre}
                                    helperText={errors.Nombre?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <WarehouseOutlined sx={{ color: 'var(--text-color)' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: 'var(--text-color)' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: 'var(--text-color)', '& fieldset': { borderColor: 'var(--border-color)' } } }}
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
                                    error={!!errors.Obs}
                                    helperText={errors.Obs?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ // Alineado arriba
                                                alignItems: 'flex-start',
                                                pt: 1.5
                                            }}>
                                                <NotesOutlined sx={{ color: 'var(--text-color)' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: 'var(--text-color)' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: 'var(--text-color)', '& fieldset': { borderColor: 'var(--border-color)' } } }}
                                />
                            )}
                        />
                        <Controller
                            name="activo"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            {...field}
                                            checked={field.value}
                                            disabled={isSaving}
                                        />
                                    }
                                    label="Estatus"
                                    sx={{ color: 'var(--text-color)' }}
                                />
                            )}
                        />
                        {errors.pesado && (
                            <FormHelperText error sx={{ ml: 1.5 }}>
                                {errors.pesado.message}
                            </FormHelperText>
                        )}
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