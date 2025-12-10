import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useForm, Controller } from 'react-hook-form'; // <-- React Hook Form
import { yupResolver } from '@hookform/resolvers/yup'; // <-- Resolver para Yup
import * as yup from 'yup'; // <-- Yup para el esquema
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText, Box,
    InputAdornment, IconButton, FormControlLabel, Checkbox
} from '@mui/material';

import { LoadingButton } from '@mui/lab'; // <-- Botón de carga
import {
    // Iconos para el formulario
    Badge, // RFID
    PersonOutline, // Nombre
    AlternateEmail, // Correo
    LockOutlined, // Contraseña
    Visibility, // Ver Contraseña
    VisibilityOff, // Ocultar Contraseña
    ManageAccountsOutlined, // Rol
    SaveOutlined, // Guardar
    Close, // Cancelar
    PersonAddOutlined, // Título de Agregar
    EditOutlined // Título de Editar
} from '@mui/icons-material';

const API_URL_USUARIO_REL = '/usuarios/';

// --- Esquema de Validación con Yup ---
const validationSchema = yup.object().shape({
    rfid: yup.string()
        .required('El RFID es obligatorio'),
    nombre: yup.string()
        .required('El nombre es obligatorio'),
    correo: yup.string()
        .email('Debe ser un correo electrónico válido')
        .required('El correo es obligatorio'),
    password: yup.string()
        .when('$isEditMode', { // Validación condicional
            is: false, // Si NO estamos editando (creando)
            then: (schema) => schema.required('La contraseña es obligatoria').min(8, 'Mínimo 8 caracteres'),
            otherwise: (schema) => schema.nullable().transform(value => value || null).min(8, 'Si ingresas nueva contraseña, mínimo 8 caracteres'), // Opcional al editar, pero si se pone, min 8
        }),
    rol: yup.string()
        .required('Debes seleccionar un rol'),
    activo: yup.boolean()
});

function UserFormModal({ open, onClose, onSaveSuccess, userToEdit }) {

    const { axiosInstance } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = userToEdit !== null;

    // --- Configuración de React Hook Form ---
    const { handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        context: { isEditMode }, // Pasamos el contexto para la validación condicional
        defaultValues: { // Valores por defecto
            rfid: '', nombre: '', correo: '', contraseña: '', rol: '', activo: false
        }
    });

    // --- Llenar/Limpiar formulario usando 'reset' de React Hook Form ---
    useEffect(() => {
        if (open) { // Resetear solo cuando se abre la modal
            if (isEditMode && userToEdit) {
                reset({
                    rfid: userToEdit.rfid || '',
                    nombre: userToEdit.nombre || '',
                    correo: userToEdit.correo || '',
                    rol: userToEdit.rol || '',
                    activo: userToEdit.activo,
                    contraseña: '',
                });
            } else {
                reset({ // Limpiar para crear
                    rfid: '', nombre: '', correo: '', contraseña: '', rol: '', activo: false
                });
            }
        }
    }, [userToEdit, open, reset, isEditMode]); // Dependencias del useEffect

    // --- Función onSubmit que recibe los datos validados ---
    const onSubmit = async (data) => {
        setIsSaving(true);
        let success = false;
        try {
            if (isEditMode) {
                const dataToUpdate = { ...data };
                // Si no se proporcionó nueva contraseña (es null por la transformación de Yup), la eliminamos
                if (!dataToUpdate.contraseña) {
                    delete dataToUpdate.contraseña;
                }
                await axiosInstance.put(`${API_URL_USUARIO_REL}${userToEdit.id}/`, dataToUpdate);
            } else {
                await axiosInstance.post(API_URL_USUARIO_REL, data);
            }
            console.log('¡Operación exitosa!');
            success = true;
        } catch (error) {
            console.error('Hubo un error:', error.response?.data || error.message);
            success = false;
            // Aquí podrías añadir lógica para mostrar errores de la API al usuario
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
        <>
            {/* Lógica para mostrar/ocultar contraseña */}
            <Dialog
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '500px' // Un ancho máximo definido
                    }
                }}
            >
                {/* El <form> ahora usa handleSubmit */}
                <form onSubmit={handleSubmit(onSubmit)}>

                    <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isEditMode ? <EditOutlined /> : <PersonAddOutlined />}
                        {isEditMode ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
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
                                        label="Nombre Completo"
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

                            {/* --- CAMPO CORREO --- */}
                            <Controller
                                name="correo"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Correo Electrónico"
                                        type="email"
                                        fullWidth
                                        variant="outlined"
                                        disabled={isSaving}
                                        error={!!errors.correo}
                                        helperText={errors.correo?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <AlternateEmail sx={{ color: 'var(--text-color)' }} />
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
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={isEditMode ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                                        // Lógica para mostrar/ocultar
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
                                            // Botón para mostrar/ocultar
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

                            {/* --- CAMPO ROL --- */}
                            <Controller
                                name="rol"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth disabled={isSaving} error={!!errors.rol}>
                                        <InputLabel id="rol-label-id" sx={{ color: 'var(--text-color)' }}>Rol</InputLabel>
                                        <Select
                                            {...field}
                                            labelId="rol-label-id"
                                            label="Rol"
                                            // Icono para el Select
                                            startAdornment={
                                                <InputAdornment position="start" sx={{ ml: 1.5, color: 'var(--text-color)' }}>
                                                    <ManageAccountsOutlined />
                                                </InputAdornment>
                                            }
                                            sx={{
                                                color: 'var(--text-color)',
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                                                '& .MuiSvgIcon-root': { color: 'var(--text-color)' },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                                            }}
                                            // Estilos del Menú desplegable
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }
                                                }
                                            }}
                                        >
                                            <MenuItem value="administrador">Administrador</MenuItem>
                                            <MenuItem value="operador">Operador</MenuItem>
                                        </Select>
                                        {errors.rol && <FormHelperText error>{errors.rol.message}</FormHelperText>}
                                    </FormControl>
                                )}
                            />
                            {/* Campo para estatus */}
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
                            color="error" // Color simbólico (rojo)
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
                            loadingPosition="start" // El spinner aparece al inicio
                            startIcon={<SaveOutlined />}
                            variant="contained"
                            color="success" // Color simbólico (verde)
                            sx={{
                                fontWeight: 'bold',
                                borderRadius: '8px',
                            }}
                        >
                            {isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
                        </LoadingButton>

                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}

export default UserFormModal;