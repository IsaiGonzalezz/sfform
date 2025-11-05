import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    InputAdornment, Box,
    TextField, Button, FormControlLabel, Checkbox, FormHelperText, Grid, CircularProgress
} from '@mui/material';
import {
    // Iconos para el formulario
    ScienceOutlined, // Para el título y nombre
    Badge,             // Para el ID
    ScaleOutlined,     // Para Presentación (peso/volumen)
    NotesOutlined,      // Para Observaciones
    Close,
    Save
} from '@mui/icons-material';

// URL de la API
const API_URL_INGREDIENTES = 'http://127.0.0.1:8000/api/ingredientes/';

// Esquema de Validación CORREGIDO (iding es string requerido)
const validationSchema = yup.object().shape({
    iding: yup.string().required('El ID es obligatorio'), // <-- CORREGIDO
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

    // --- React Hook Form CORREGIDO (iding incluido) ---
    const { handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: { iding: '', nombre: '', presentacion: null, observaciones: '', pesado: false } // <-- CORREGIDO
    });

    // --- Efecto para Cargar Datos/Resetear CORREGIDO (iding incluido) ---
    useEffect(() => {
        if (open) {
            if (isEditMode && ingredienteToEdit) {
                reset({
                    iding: ingredienteToEdit.iding || '', // <-- CORREGIDO
                    nombre: ingredienteToEdit.nombre || '',
                    presentacion: ingredienteToEdit.presentacion || null,
                    observaciones: ingredienteToEdit.observaciones || '',
                    pesado: Boolean(ingredienteToEdit.pesado),
                });
            } else {
                // Limpia para crear
                reset({ iding: '', nombre: '', presentacion: null, observaciones: '', pesado: false }); // <-- CORREGIDO
            }
        }
    }, [ingredienteToEdit, open, reset, isEditMode]);

    // --- Función de Envío CORREGIDA (iding incluido en payload) ---
    const onSubmit = async (data) => {
        setIsSaving(true);
        let success = false;

        // El payload AHORA incluye iding
        const payload = {
            iding: data.iding, // <-- CORREGIDO
            nombre: data.nombre,
            presentacion: data.presentacion,
            observaciones: data.observaciones,
            pesado: data.pesado,
        };

        try {
            if (isEditMode) {
                // PUT: iding va en la URL. El payload puede o no incluirlo (DRF lo ignora si es read_only en el serializer para PUT)
                // Es más seguro enviar solo los campos modificables en PUT
                const updatePayload = {
                    nombre: data.nombre,
                    presentacion: data.presentacion,
                    observaciones: data.observaciones,
                    pesado: data.pesado,
                };
                await axios.put(`${API_URL_INGREDIENTES}${ingredienteToEdit.iding}/`, updatePayload);
            } else {
                // POST: SÍ necesita enviar el iding tecleado
                await axios.post(API_URL_INGREDIENTES, payload);
            }
            success = true;
            console.log('¡Operación de ingrediente exitosa!');
        } catch (error) {
            console.error('Error al guardar ingrediente:', error.response?.data || error.message);
            success = false;
            // Considera mostrar un mensaje de error al usuario aquí
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
        bgcolor: '#1e1e1e', // Fondo oscuro estándar
        color: '#e0e0e0',   // Texto claro estándar
        borderRadius: '12px', // Bordes redondeados estándar
    };

    const inputStyle = {
        width: '100%',
        '& .MuiOutlinedInput-root': {
            color: '#e0e0e0',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#0077D1' }, // Azul primario
            '&.Mui-disabled': {
                backgroundColor: 'rgba(70, 70, 70, 0.5)',
                color: '#888',
                '& fieldset': { borderColor: 'rgba(100, 100, 100, 0.3)' },
            },
        },
        '& .MuiInputLabel-root': { color: '#bbb' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#0077D1' }, // Azul primario
    };

    const checkboxStyle = {
        color: '#bbb',
        '&.Mui-checked': { color: '#00B4D8' }, // Azul secundario
        '&.Mui-disabled': { color: '#555' }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose} // Cierra al hacer clic fuera
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: darkModalStyle }} // Usamos tu estilo original
        >
            <form onSubmit={handleSubmit(onSubmit)}>

                <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceOutlined /> {/* <-- ICONO AÑADIDO */}
                    {isEditMode ? 'Editar Ingrediente' : 'Agregar Nuevo Ingrediente'}
                </DialogTitle>

                <DialogContent>
                    {/* Usamos un Box para dar espaciado vertical (como en los otros forms) */}
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
                                            sx={inputStyle} // Tu estilo original
                                            InputProps={{ // <-- ICONO AÑADIDO
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
                                            sx={inputStyle} // Tu estilo original
                                            InputProps={{ // <-- ICONO AÑADIDO
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
                                            sx={inputStyle} // Tu estilo original
                                            InputProps={{
                                                inputProps: { step: "any" },
                                                startAdornment: ( // <-- ICONO AÑADIDO
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
                                            sx={inputStyle} // Tu estilo original
                                            InputProps={{ // <-- ICONO AÑADIDO
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
                                                    sx={checkboxStyle} // Tu estilo original
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

                <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid #333', mt: 2 }}>

                    {/* --- BOTÓN CANCELAR (MEJORADO) --- */}
                    <Button
                        onClick={onClose}
                        disabled={isSaving}
                        startIcon={<Close />}
                        variant="outlined" // <-- AÑADIDO
                        color="error"      // <-- AÑADIDO
                        sx={{ borderRadius: '8px' }} // Estilo consistente
                    >
                        Cancelar
                    </Button>

                    {/* --- BOTÓN GUARDAR (MEJORADO) --- */}
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSaving}
                        startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        color="success" // <-- AÑADIDO (Verde)
                        sx={{
                            fontWeight: 'bold',
                            borderRadius: '8px', // Estilo consistente
                            // Quitamos el fondo azul para usar el 'color' de MUI
                            '&.Mui-disabled': {
                                background: 'rgba(100, 100, 100, 0.3)',
                                color: 'rgba(255, 255, 255, 0.3)'
                            },
                        }}
                    >
                        {isSaving
                            ? (isEditMode ? 'Guardando...' : 'Creando...')
                            : (isEditMode ? 'Guardar Cambios' : 'Crear Ingrediente')
                        }
                    </Button>
                </DialogActions>

            </form>
        </Dialog>
    );
}

export default IngredienteFormModal;