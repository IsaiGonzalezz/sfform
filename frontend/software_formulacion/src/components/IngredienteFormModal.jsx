import React, { useState, useEffect } from 'react'; // <-- 1. AÑADIDO useState
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    InputAdornment, Box,
    TextField, Button, FormControlLabel, Checkbox, FormHelperText, Grid
    // CircularProgress ya no se importa aquí
} from '@mui/material';
import { LoadingButton } from '@mui/lab'; // <-- 2. AÑADIDO LoadingButton
import {
    // Iconos para el formulario
    ScienceOutlined, // Para el título y nombre
    Badge,             // Para el ID
    ScaleOutlined,     // Para Presentación (peso/volumen)
    NotesOutlined,     // Para Observaciones
    Close,             // <-- 3. AÑADIDO Close
    SaveOutlined       // <-- 4. AÑADIDO SaveOutlined
} from '@mui/icons-material';

// URL de la API
const API_URL_INGREDIENTES = 'http://127.0.0.1:8000/api/ingredientes/';

// Esquema de Validación (Tu código original)
const validationSchema = yup.object().shape({
    iding: yup.string().required('El ID es obligatorio'),
    nombre: yup.string().required('El nombre es obligatorio'),
    presentacion: yup.number().typeError('Debe ser número').nullable(),
    observaciones: yup.string().nullable(),
    pesado: yup.boolean(),
});

// Props: open, onClose, onSaveSuccess, ingredienteToEdit
function IngredienteFormModal({ open, onClose, onSaveSuccess, ingredienteToEdit }) {

    // --- Estados ---
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = ingredienteToEdit !== null;
    
    // (showPassword no se usa aquí, así que no se añade)

    // --- React Hook Form (Tu código original) ---
    const { handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: { iding: '', nombre: '', presentacion: null, observaciones: '', pesado: false }
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
                });
            } else {
                reset({ iding: '', nombre: '', presentacion: null, observaciones: '', pesado: false });
            }
        }
    }, [ingredienteToEdit, open, reset, isEditMode]);

    // --- Función de Envío (¡AQUÍ ESTÁ LA CORRECCIÓN!) ---
    const onSubmit = async (data) => {
        setIsSaving(true);
        let success = false;

        // 'data' es el objeto del formulario, que SÍ incluye 'iding'
        // gracias a tu 'validationSchema' y 'useEffect/reset'.

        try {
            if (isEditMode) {
                // ¡CORRECCIÓN!
                // Tu prueba de API (la foto) demostró que el backend SÍ quiere
                // el 'iding' en el cuerpo del JSON para el PUT.
                // Así que enviamos 'data' directamente.
                await axios.put(`${API_URL_INGREDIENTES}${ingredienteToEdit.iding}/`, data);
            } else {
                // POST: También enviamos 'data' (que tiene el 'iding' tecleado)
                await axios.post(API_URL_INGREDIENTES, data);
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

    // --- Estilos Consistentes ---
    const darkModalStyle = {
        bgcolor: '#1e1e1e', 
        color: '#e0e0e0',   
        borderRadius: '12px',
    };

    // --- ESTILOS CORREGIDOS (Sin azules) ---
    const inputStyle = {
        width: '100%',
        '& .MuiOutlinedInput-root': {
            color: '#e0e0e0',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' }, // <-- USA EL TEMA
            '&.Mui-disabled': {
                backgroundColor: 'rgba(70, 70, 70, 0.5)',
                color: '#888',
                '& fieldset': { borderColor: 'rgba(100, 100, 100, 0.3)' },
            },
        },
        '& .MuiInputLabel-root': { color: '#bbb' },
        '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }, // <-- USA EL TEMA
    };

    const checkboxStyle = {
        color: '#bbb',
        '&.Mui-checked': { color: 'primary.main' }, // <-- USA EL TEMA
        '&.Mui-disabled': { color: '#555' }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: darkModalStyle }} 
        >
            <form onSubmit={handleSubmit(onSubmit)}>

                <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceOutlined /> 
                    {isEditMode ? 'Editar Ingrediente' : 'Agregar Nuevo Ingrediente'}
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <Grid container spacing={2}>

                            {/* Fila 1: ID y Nombre */}
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
                                    name="nombre"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Nombre"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.nombre}
                                            helperText={errors.nombre?.message}
                                            sx={inputStyle} 
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
                            </Grid>

                            {/* Fila 2: Presentación y Observaciones */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="presentacion"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Presentación (Kg/Lt...)"
                                            type="number"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.presentacion}
                                            helperText={errors.presentacion?.message}
                                            sx={inputStyle}
                                            InputProps={{ 
                                                inputProps: { step: "any" },
                                                startAdornment: ( 
                                                    <InputAdornment position="start">
                                                        <ScaleOutlined sx={{ color: 'text.secondary' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="observaciones"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Observaciones (Opcional)"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.observaciones}
                                            helperText={errors.observaciones?.message}
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
                            </Grid>

                            {/* Fila 3: Checkbox Pesado */}
                            <Grid item xs={12}>
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
                                            label="Requiere Pesado"
                                            sx={{ color: '#bbb' }}
                                        />
                                    )}
                                />
                                {errors.pesado && <FormHelperText error sx={{ ml: 1.5 }}>{errors.pesado.message}</FormHelperText>}
                            </Grid>

                        </Grid>
                    </Box>
                </DialogContent>

                {/* --- 4. ACCIONES DE DIÁLOGO (BOTONES CORREGIDOS) --- */}
                <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid #333', mt: 2 }}>
                    
                    {/* Botón Cancelar (Rojo) */}
                    <Button
                        onClick={onClose}
                        disabled={isSaving}
                        startIcon={<Close />} // <-- CORREGIDO
                        variant="outlined"
                        color="error"
                        sx={{ borderRadius: '8px' }}
                    >
                        Cancelar
                    </Button>
                    
                    {/* Botón Guardar (Verde con Carga) */}
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={isSaving} // <-- CORREGIDO
                        loadingPosition="start"
                        startIcon={<SaveOutlined />} // <-- CORREGIDO
                        color="success"
                        sx={{
                            fontWeight: 'bold',
                            borderRadius: '8px',
                        }}
                    >
                        {isEditMode ? 'Guardar Cambios' : 'Crear Ingrediente'}
                    </LoadingButton>

                </DialogActions>

            </form>
        </Dialog>
    );
}

export default IngredienteFormModal;