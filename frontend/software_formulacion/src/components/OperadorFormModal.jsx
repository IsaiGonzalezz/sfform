import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, IconButton,
    TextField, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText, Box, CircularProgress, Checkbox, 
    FormControlLabel
} from '@mui/material';
import { LoadingButton } from '@mui/lab'; // Botón de carga
import {
    // Iconos para el formulario
    Badge, // RFID
    PersonOutline, // Nombre
    LockOutlined, // Contraseña
    Visibility, // Ver Contraseña
    VisibilityOff, // Ocultar Contraseña
    WarehouseOutlined, // Estación
    EngineeringOutlined, // Título Agregar
    EditOutlined, // Título Editar
    SaveOutlined, // Guardar
    Close // Cancelar
} from '@mui/icons-material';


const API_URL_OPERADORES_REL = '/operadores/';

// Esquema de Validación para Operadores
const validationSchema = yup.object().shape({
    rfid: yup.string().required('El RFID es obligatorio'),
    nombre: yup.string().required('El nombre es obligatorio'),
    contraseña: yup.string()
        .when('$isEditMode', {
            is: false,
            then: (schema) => schema.required('La contraseña es obligatoria').min(8, 'Mínimo 8 caracteres'),
            otherwise: (schema) => schema.nullable().transform(value => value || null).min(8, 'Si ingresas nueva contraseña, mínimo 8 caracteres'),
        }),
    idest: yup.string().required('Debes seleccionar una estación'), // Campo para el ID de la estación
    activo: yup.boolean(),
});

// Props: open, onClose, onSaveSuccess, operadorToEdit, estacionesList
function OperadorFormModal({ open, onClose, onSaveSuccess, operadorToEdit, estacionesList }) {

    const { axiosInstance } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = operadorToEdit !== null;

    const { handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        context: { isEditMode },
        defaultValues: { rfid: '', nombre: '', contraseña: '', idest: '', activo: true } // idest inicializado vacío
    });

    const checkboxStyle = {
        color: 'var(--text-color)',
        '&.Mui-checked': { color: 'var(--text-color)' }, // <-- USA EL TEMA
        '&.Mui-disabled': { color: '#555' }
    };

    useEffect(() => {
        if (open) {
            if (isEditMode && operadorToEdit) {
                reset({
                    rfid: operadorToEdit.rfid || '',
                    nombre: operadorToEdit.nombre || '',
                    idest: operadorToEdit.idest || '', // Llenar el ID de la estación
                    contraseña: '',
                    activo: Boolean(operadorToEdit.activo)
                });
            } else {
                reset({ rfid: '', nombre: '', contraseña: '', idest: '', activo: true });
            }
        }
    }, [operadorToEdit, open, reset, isEditMode]);

    const onSubmit = async (data) => {
        setIsSaving(true);
        let success = false;
        try {
            if (isEditMode) {
                const dataToUpdate = { ...data };
                if (!dataToUpdate.contraseña) delete dataToUpdate.contraseña;
                await axiosInstance.put(`${API_URL_OPERADORES_REL}${operadorToEdit.rfid}/`, dataToUpdate);
            } else {
                await axiosInstance.post(API_URL_OPERADORES_REL, data);
            }
            console.log('¡Operación de operador exitosa!');
            success = true;
        } catch (error) {
            console.error('Error al guardar operador:', error.response?.data || error.message);
            success = false;
        } finally {
            setIsSaving(false);
            if (success) {
                onSaveSuccess();
                onClose();
            }
        }
    };

    const [showPassword, setShowPassword] = useState(false);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    backgroundColor: 'var(--bg-color)',
                    color: '#fff',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '500px'
                }
            }}
        >
            <form onSubmit={handleSubmit(onSubmit)}>

                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: 'var(--text-color)' }}>
                    {isEditMode ? <EditOutlined /> : <EngineeringOutlined />}
                    {isEditMode ? 'Editar Operador' : 'Agregar Nuevo Operador'}
                </DialogTitle>

                <DialogContent>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>

                        {/* --- CAMPO RFID --- */}
                        <Controller
                            name="rfid"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    autoFocus
                                    label="RFID"
                                    fullWidth
                                    variant="outlined"
                                    disabled={isSaving || isEditMode}
                                    error={!!errors.rfid}
                                    helperText={errors.rfid?.message}
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

                        {/* --- CAMPO NOMBRE --- */}
                        <Controller
                            name="nombre"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nombre Operador"
                                    fullWidth
                                    variant="outlined"
                                    disabled={isSaving}
                                    error={!!errors.nombre}
                                    helperText={errors.nombre?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutline sx={{ color: 'var(--text-color)' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: 'var(--text-color)' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: 'var(--text-color)', '& fieldset': { borderColor: 'var(--border-color)' } } }}
                                />
                            )}
                        />

                        {/* --- CAMPO CONTRASEÑA --- */}
                        <Controller
                            name="contraseña"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={isEditMode ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                                    type={showPassword ? 'text' : 'password'}
                                    fullWidth
                                    variant="outlined"
                                    disabled={isSaving}
                                    error={!!errors.contraseña}
                                    helperText={errors.contraseña?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlined sx={{ color: 'var(--text-color)' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    sx={{ color: 'var(--text-color)' }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    InputLabelProps={{ sx: { color: 'var(--text-color)' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: 'var(--text-color)', '& fieldset': { borderColor: 'var(--border-color)' } } }}
                                />
                            )}
                        />

                        {/* --- CAMPO SELECT ESTACIÓN --- */}
                        <Controller
                            name="idest"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth disabled={isSaving || !estacionesList} error={!!errors.idest}>
                                    <InputLabel id="estacion-select-label" sx={{ color: 'var(--text-color)' }}>Estación Asignada</InputLabel>
                                    <Select
                                        {...field}
                                        labelId="estacion-select-label"
                                        label="Estación Asignada"
                                        startAdornment={
                                            <InputAdornment position="start" sx={{ ml: 1.5, color: 'var(--text-color)' }}>
                                                <WarehouseOutlined />
                                            </InputAdornment>
                                        }
                                        sx={{
                                            color: 'var(--text-color)',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                                            '& .MuiSvgIcon-root': { color: 'var(--text-color)' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }
                                            }
                                        }}
                                    >
                                        {/* Mostrar opción de carga o si no hay estaciones */}
                                        {!estacionesList ? (
                                            <MenuItem value="" disabled>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CircularProgress size={20} />
                                                    <Typography variant="body2">Cargando estaciones...</Typography>
                                                </Box>
                                            </MenuItem>
                                        ) : estacionesList.length === 0 ? (
                                            <MenuItem value="" disabled>No hay estaciones disponibles</MenuItem>
                                        ) : (
                                            // Mapear la lista de estaciones a MenuItems
                                            estacionesList.map((estacion) => (
                                                <MenuItem key={estacion.id} value={estacion.id}>
                                                    {estacion.nombre} ({estacion.id})
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                    {errors.idest && <FormHelperText error>{errors.idest.message}</FormHelperText>}
                                </FormControl>
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
                                            sx={checkboxStyle}
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
                    <LoadingButton
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
                        {isEditMode ? 'Guardar Cambios' : 'Crear Operador'}
                    </LoadingButton>

                </DialogActions>
            </form>
        </Dialog>
    );
}

export default OperadorFormModal;