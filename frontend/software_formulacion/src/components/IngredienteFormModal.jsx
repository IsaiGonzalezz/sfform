import React, { useState, useEffect } from 'react'; // <-- 1. AÑADIDO useState
import { useAuth } from '../context/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    InputAdornment, Box, Stack,
    TextField, Button, FormControlLabel, Checkbox, FormHelperText, Grid
} from '@mui/material';
import { LoadingButton } from '@mui/lab'; 
import {
    // Iconos para el formulario
    ScienceOutlined, // Para el título y nombre
    Badge,             // Para el ID
    ScaleOutlined,     // Para Presentación (peso/volumen)
    NotesOutlined,     
    Close,             
    SaveOutlined       
} from '@mui/icons-material';

// URL de la API
const API_URL_INGREDIENTES_REL = '/ingredientes/';

// Esquema de Validación (Tu código original)
const validationSchema = yup.object().shape({
    iding: yup.string().required('El ID es obligatorio'),
    nombre: yup.string().required('El nombre es obligatorio'),
    presentacion: yup.number().typeError('Debe ser número').nullable(),
    observaciones: yup.string().nullable(),
    pesado: yup.boolean(),
    activo : yup.boolean()
});

// Props: open, onClose, onSaveSuccess, ingredienteToEdit
function IngredienteFormModal({ open, onClose, onSaveSuccess, ingredienteToEdit }) {

    // --- Estados ---
    
    const { axiosInstance } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = ingredienteToEdit !== null;


    // --- React Hook Form (Tu código original) ---
    const { handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: { iding: '', nombre: '', presentacion: null, observaciones: '', pesado: false, activo : false }
    });

    // --- Efecto para Cargar Datos/Resetear (Tu código original) ---
    useEffect(() => {
        if (open) {
            if (isEditMode && ingredienteToEdit) {
                reset({
                    iding: ingredienteToEdit.iding || '',
                    nombre: ingredienteToEdit.nombre || '',
                    presentacion: ingredienteToEdit.presentacion || null,
                    observaciones: ingredienteToEdit.observaciones || '',
                    pesado: Boolean(ingredienteToEdit.pesado),
                    activo: Boolean(ingredienteToEdit.activo),
                });
            } else {
                reset({ iding: '', nombre: '', presentacion: null, observaciones: '', pesado: false, activo : false});
            }
        }
    }, [ingredienteToEdit, open, reset, isEditMode]);

    // --- Función de Envío (¡AQUÍ ESTÁ LA CORRECCIÓN!) ---
    const onSubmit = async (data) => {
        setIsSaving(true);
        let success = false;
        try {
            if (isEditMode) {
                await axiosInstance.put(`${API_URL_INGREDIENTES_REL}${ingredienteToEdit.iding}/`, data);
            } else {
                // POST: También enviamos 'data' (que tiene el 'iding' tecleado)
                await axiosInstance.post(API_URL_INGREDIENTES_REL, data);
            }
            success = true;
            console.log('¡Operación de ingrediente exitosa!');
        } catch (error) {
            // El console.log que me mandaste estaba aquí:
            console.error('Error al guardar ingrediente:', error.response?.data || error.message);
            success = false;
        } finally {
            setIsSaving(false);
            if (success) {
                onSaveSuccess(); // Recarga tabla
                onClose();       // Cierra modal
            }
        }
    };


    const inputStyle = {
        width: '100%',
        '& .MuiOutlinedInput-root': {
            color: 'var(--text-color)',
            '& fieldset': { borderColor: 'var(--border-color)' },
            '&:hover fieldset': { borderColor: 'var(--border-color)' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' }, 
            '&.Mui-disabled': {
                backgroundColor: 'var(--border-color)',
                color: 'var(--text-color)',
                '& fieldset': { borderColor: 'var(--border-color)'},
            },
        },
        '& .MuiInputLabel-root': { color: 'var(--text-color)' },
        '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }, // <-- USA EL TEMA
    };

    const checkboxStyle = {
        color: 'var(--text-color)',
        '&.Mui-checked': { color: 'var(--text-color)' }, // <-- USA EL TEMA
        '&.Mui-disabled': { color: '#555' }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{}}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Título */}
                <DialogTitle
                    sx={{
                        fontWeight: 'bold',
                        borderBottom: '1px solid #333',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <ScienceOutlined />
                    {isEditMode ? 'Editar Ingrediente' : 'Agregar Nuevo Ingrediente'}
                </DialogTitle>

                {/* Contenido */}
                <DialogContent>
                    <Stack spacing={3} pt={1}>
                        {/* Fila: ID y Presentación */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="iding"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            autoFocus={!isEditMode}
                                            label="ID Ingrediente"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving || isEditMode}
                                            error={!!errors.iding}
                                            helperText={errors.iding?.message}
                                            sx={inputStyle}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Badge sx={{ color: 'text.secondary' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="presentacion"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Presentación (Gr/Kg/Ml/Lt)"
                                            type="number"
                                            required
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.presentacion}
                                            helperText={errors.presentacion?.message}
                                            sx={inputStyle}
                                            InputProps={{
                                                inputProps: { step: 'any' },
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <ScaleOutlined sx={{ color: 'var(--text-color)' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        <Controller
                            name="nombre"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nombre del Ingrediente"
                                    fullWidth
                                    variant="outlined"
                                    disabled={isSaving}
                                    error={!!errors.nombre}
                                    helperText={errors.nombre?.message}
                                    sx={inputStyle}
                                    inputProps={{ maxLength: 100 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ScienceOutlined sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />

                        {/* Campo: Observaciones */}
                        <Controller
                            name="observaciones"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Observaciones"
                                    required
                                    fullWidth
                                    variant="outlined"
                                    disabled={isSaving}
                                    error={!!errors.observaciones}
                                    helperText={errors.observaciones?.message}
                                    multiline
                                    minRows={3}
                                    maxRows={6}
                                    sx={inputStyle}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <NotesOutlined sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />

                        {/* Checkbox: Pesado */}
                        <Box>
                            <Controller
                                name="pesado"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                {...field}
                                                checked={field.value}
                                                disabled={isSaving}
                                                sx={checkboxStyle}
                                            />
                                        }
                                        label="¿Requiere Pesado?"
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

                        <Box>
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
                                                sx={checkboxStyle}
                                            />
                                        }
                                        label="Estatus"
                                        sx={{ color: 'var(--text-color)'}}
                                    />
                                )}
                            />
                            {errors.pesado && (
                                <FormHelperText error sx={{ ml: 1.5 }}>
                                    {errors.pesado.message}
                                </FormHelperText>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>

                {/* Acciones */}
                <DialogActions
                    sx={{ p: '16px 24px', borderTop: '1px solid #333', mt: 2 }}
                >
                    <Button
                        onClick={onClose}
                        disabled={isSaving}
                        startIcon={<Close />}
                        variant="outlined"
                        color="error"
                        sx={{ borderRadius: '8px' }}
                    >
                        Cancelar
                    </Button>

                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={isSaving}
                        loadingPosition="start"
                        startIcon={<SaveOutlined />}
                        color="success"
                        sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                    >
                        {isEditMode ? 'Guardar Cambios' : 'Crear Ingrediente'}
                    </LoadingButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default IngredienteFormModal;