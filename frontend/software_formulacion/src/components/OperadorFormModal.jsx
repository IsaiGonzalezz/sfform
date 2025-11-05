import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, IconButton,
    TextField, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText, Box, CircularProgress // Añadido Box y CircularProgress
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


const API_URL_OPERADORES = 'http://127.0.0.1:8000/api/operadores/';

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
});

// Props: open, onClose, onSaveSuccess, operadorToEdit, estacionesList
function OperadorFormModal({ open, onClose, onSaveSuccess, operadorToEdit, estacionesList }) {

    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = operadorToEdit !== null;

    const { handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        context: { isEditMode },
        defaultValues: { rfid: '', nombre: '', contraseña: '', idest: '' } // idest inicializado vacío
    });

    useEffect(() => {
        if (open) {
            if (isEditMode && operadorToEdit) {
                reset({
                    rfid: operadorToEdit.rfid || '',
                    nombre: operadorToEdit.nombre || '',
                    idest: operadorToEdit.idest || '', // Llenar el ID de la estación
                    contraseña: '',
                });
            } else {
                reset({ rfid: '', nombre: '', contraseña: '', idest: '' });
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
                await axios.put(`${API_URL_OPERADORES}${operadorToEdit.rfid}/`, dataToUpdate);
            } else {
                await axios.post(API_URL_OPERADORES, data);
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
                    backgroundColor: '#1e1e1e',
                    color: '#fff',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '500px'
                }
            }}
        >
            <form onSubmit={handleSubmit(onSubmit)}>

                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isEditMode ? <EditOutlined /> : <EngineeringOutlined />}
                    {isEditMode ? 'Editar Operador' : 'Agregar Nuevo Operador'}
                </DialogTitle>

                <DialogContent>
                    {/* Usamos un Box para dar espaciado uniforme */}
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
                                                <Badge sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: '#bbb' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }}
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
                                                <PersonOutline sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: { color: '#bbb' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }}
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
                                                <LockOutlined sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    sx={{ color: 'text.secondary' }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    InputLabelProps={{ sx: { color: '#bbb' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }}
                                />
                            )}
                        />

                        {/* --- CAMPO SELECT ESTACIÓN --- */}
                        <Controller
                            name="idest"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth disabled={isSaving || !estacionesList} error={!!errors.idest}>
                                    <InputLabel id="estacion-select-label" sx={{ color: '#bbb' }}>Estación Asignada</InputLabel>
                                    <Select
                                        {...field}
                                        labelId="estacion-select-label"
                                        label="Estación Asignada"
                                        startAdornment={
                                            <InputAdornment position="start" sx={{ ml: 1.5, color: 'text.secondary' }}>
                                                <WarehouseOutlined />
                                            </InputAdornment>
                                        }
                                        sx={{
                                            color: '#fff',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                            '& .MuiSvgIcon-root': { color: '#fff' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: { backgroundColor: '#2b2b2b', color: '#fff' }
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