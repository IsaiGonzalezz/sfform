import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Grid, Box, Typography, FormHelperText, CircularProgress, Avatar // Avatar para previsualizar logo
} from '@mui/material';
import { styled } from '@mui/material/styles'; // Para estilizar el input de archivo
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Icono para subir
import BusinessIcon from '@mui/icons-material/Business';


const API_URL_EMPRESA = 'http://127.0.0.1:8000/api/empresa/';

// --- Esquema de Validación ---
// Ajusta los 'required' según necesites
const validationSchema = yup.object().shape({
    rfc: yup.string().required('El RFC es obligatorio'), // <-- rfc
    nombre: yup.string().required('El nombre es obligatorio'), // <-- nombre
    calle: yup.string().required('La calle es obligatoria'),   // <-- calle
    colonia: yup.string().required('La colonia es obligatoria'), // <-- colonia
    ciudad: yup.string().required('La ciudad es obligatoria'),  // <-- ciudad
    estado: yup.string().required('El estado es obligatorio'),  // <-- estado
    cp: yup.string().required('El Código Postal es obligatorio'), // <-- cp
    contacto: yup.string().required('El nombre de contacto es obligatorio'), // <-- contacto
    correo: yup.string().email('Correo inválido').required('El correo es obligatorio'), // <-- correo
    telefono: yup.string().required('El teléfono es obligatorio'), // <-- telefono
    logotipo: yup.mixed() // <-- logotipo (lowercase)
        .nullable()
        .test('fileSize', 'El archivo es muy grande (máx 2MB)', value => {
            if (!value || value.length === 0) return true; // Permite no subir archivo
            return value[0].size <= 2097152; // 2MB
        })
        .test('fileType', 'Solo se permiten imágenes (JPEG, PNG, GIF)', value => {
            if (!value || value.length === 0) return true;
            return ['image/jpeg', 'image/png', 'image/gif'].includes(value[0].type);
        }),
});

// --- Componente Estilizado para el Input de Archivo ---
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

// --- Componente Principal ---
function EmpresaFormModal({ open, onClose, onSaveSuccess, empresaToEdit }) {

    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null); // Para la previsualización
    const isEditMode = empresaToEdit !== null;

    const { handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            rfc: '', nombre: '', calle: '', colonia: '', ciudad: '', estado: '',
            cp: '', contacto: '', correo: '', telefono: '', logotipo: null,
        }
    });

    // Observa el campo Logotipo para actualizar la preview
    const logoFile = watch('logotipo');

    useEffect(() => {
        if (open) {
            if (isEditMode && empresaToEdit) {
                reset({ // Llenamos el form con datos existentes
                    rfc: empresaToEdit.rfc || '', // Asume que los datos de la API también vienen en lowercase
                    nombre: empresaToEdit.nombre || '',
                    calle: empresaToEdit.calle || '',
                    colonia: empresaToEdit.colonia || '',
                    ciudad: empresaToEdit.ciudad || '',
                    estado: empresaToEdit.estado || '',
                    cp: empresaToEdit.cp || '',
                    contacto: empresaToEdit.contacto || '',
                    correo: empresaToEdit.correo || '',
                    telefono: empresaToEdit.telefono || '',
                    logotipo: null, 
                });
                // Si la empresa ya tiene un logo (URL), lo ponemos en la preview
                setLogoPreview(empresaToEdit.logotipo || null);
            } else {
                // Limpiamos para crear
                reset({
                    rfc: '', nombre: '', calle: '', colonia: '', ciudad: '', estado: '',
                    cp: '', contacto: '', correo: '', telefono: '', logotipo: null,
                });
                setLogoPreview(null); // Limpiamos preview
            }
        }
    }, [empresaToEdit, open, reset, isEditMode]);

    // Actualiza la preview cuando se selecciona un archivo nuevo
    useEffect(() => {
        if (logoFile && logoFile.length > 0) {
            const file = logoFile[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else if (!isEditMode) {
            // Si se quita el archivo al crear, limpiar preview
            // En modo edición, si se quita, mantenemos la preview del logo actual si existe
            if (!empresaToEdit?.logotipo) setLogoPreview(null);
        }
    }, [logoFile, isEditMode, empresaToEdit]);


    // --- Función onSubmit ---
    const onSubmit = async (data) => {
        setIsSaving(true);
        let success = false;

        // --- Usamos FormData para enviar archivos ---
        const formDataToSend = new FormData();

        // Agregamos todos los campos de texto
        Object.keys(data).forEach(key => {
            if (key !== 'logotipo' && data[key] !== null && data[key] !== undefined) {
                formDataToSend.append(key, data[key]);
            }
        });

        // Agregamos el archivo de logo SI SE SELECCIONÓ UNO NUEVO
        if (data.logotipo && data.logotipo.length > 0) {
            formDataToSend.append('logotipo', data.logotipo[0]);
        }

        try {
            let response;
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' } // Importante para archivos
            };

            if (isEditMode) {
                // PUT para actualizar (usando el RFC como identificador)
                response = await axios.put(`${API_URL_EMPRESA}${empresaToEdit.rfc}/`, formDataToSend, config);
            } else {
                // POST para crear
                response = await axios.post(API_URL_EMPRESA, formDataToSend, config);
            }
            console.log('¡Operación de empresa exitosa!', response.data);
            success = true;
        } catch (error) {
            console.error('Error al guardar empresa:', error.response?.data || error.message);
            success = false;
            // Mostrar error específico de la API si existe
            if (error.response && error.response.data) {
                // Aquí podrías iterar sobre error.response.data y usar `setError` de react-hook-form
                // para mostrar errores específicos por campo. Por ahora, solo log.
                console.error("Detalles del error:", error.response.data);
            }
        } finally {
            setIsSaving(false);
            if (success) {
                onSaveSuccess(); // Recarga los datos en la página principal
                onClose();       // Cierra la modal
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md" // Hacemos la modal un poco más ancha
            fullWidth // Para que use el maxWidth
            PaperProps={{ sx: { backgroundColor: '#1e1e1e', color: '#fff', borderRadius: '12px' } }}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {isEditMode ? 'Editar Información de la Empresa' : 'Registrar Empresa'}
                </DialogTitle>

                <DialogContent>
                    {/* Usamos Grid para organizar los campos */}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* --- Fila 1: RFC y Nombre --- */}
                        <Grid item xs={12} sm={6}>
                            <Controller name="rfc" control={control} render={({ field }) => (<TextField {...field} label="RFC" fullWidth variant="outlined" disabled={isSaving || isEditMode} error={!!errors.RFC} helperText={errors.RFC?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="nombre" control={control} render={({ field }) => (<TextField {...field} label="Nombre de la Empresa" fullWidth variant="outlined" disabled={isSaving} error={!!errors.Nombre} helperText={errors.Nombre?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>

                        {/* --- Fila 2: Calle y Colonia --- */}
                        <Grid item xs={12} sm={6}>
                            <Controller name="calle" control={control} render={({ field }) => (<TextField {...field} label="Calle" fullWidth variant="outlined" disabled={isSaving} error={!!errors.Calle} helperText={errors.Calle?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="colonia" control={control} render={({ field }) => (<TextField {...field} label="Colonia" fullWidth variant="outlined" disabled={isSaving} error={!!errors.Colonia} helperText={errors.Colonia?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>

                        {/* --- Fila 3: Ciudad, Estado, CP --- */}
                        <Grid item xs={12} sm={4}>
                            <Controller name="ciudad" control={control} render={({ field }) => (<TextField {...field} label="Ciudad" fullWidth variant="outlined" disabled={isSaving} error={!!errors.Ciudad} helperText={errors.Ciudad?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="estado" control={control} render={({ field }) => (<TextField {...field} label="Estado" fullWidth variant="outlined" disabled={isSaving} error={!!errors.Estado} helperText={errors.Estado?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="cp" control={control} render={({ field }) => (<TextField {...field} label="Código Postal" fullWidth variant="outlined" disabled={isSaving} error={!!errors.CP} helperText={errors.CP?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>

                        {/* --- Fila 4: Contacto, Correo, Teléfono --- */}
                        <Grid item xs={12} sm={4}>
                            <Controller name="contacto" control={control} render={({ field }) => (<TextField {...field} label="Nombre Contacto" fullWidth variant="outlined" disabled={isSaving} error={!!errors.Contacto} helperText={errors.Contacto?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="correo" control={control} render={({ field }) => (<TextField {...field} label="Correo Contacto" type="email" fullWidth variant="outlined" disabled={isSaving} error={!!errors.Correo} helperText={errors.Correo?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="telefono" control={control} render={({ field }) => (<TextField {...field} label="Teléfono Contacto" fullWidth variant="outlined" disabled={isSaving} error={!!errors.Telefono} helperText={errors.Telefono?.message} InputLabelProps={{ sx: { color: '#bbb' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' } } }} />)} />
                        </Grid>

                        {/* --- Sección de Carga de Logo --- */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ color: '#bbb', mb: 1 }}>Logotipo</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* Previsualización del logo */}
                                <Avatar
                                    src={logoPreview || undefined} // Muestra preview si existe
                                    alt="Logo Preview"
                                    variant="rounded" // O 'circular' si prefieres
                                    sx={{ width: 80, height: 80, bgcolor: 'rgba(255, 255, 255, 0.1)' }} // Fondo por si no hay imagen
                                >
                                    <BusinessIcon /> {/* Icono por defecto si no hay preview */}
                                </Avatar>
                                {/* Botón para seleccionar archivo */}
                                <Button
                                    component="label"
                                    role={undefined}
                                    variant="outlined"
                                    tabIndex={-1}
                                    startIcon={<CloudUploadIcon />}
                                    disabled={isSaving}
                                    sx={{ color: '#bbb', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                                >
                                    {isEditMode && logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                                    {/* Usamos Controller para el input de archivo */}
                                    <Controller
                                        name="logotipo"
                                        control={control}
                                        render={({ field: { onChange, onBlur, name, ref } }) => (
                                            <VisuallyHiddenInput
                                                type="file"
                                                accept="image/png, image/jpeg, image/gif" // Tipos aceptados
                                                onBlur={onBlur}
                                                name={name}
                                                ref={ref}
                                                onChange={(e) => {
                                                    onChange(e.target.files); // Actualiza el valor en React Hook Form
                                                }}
                                                disabled={isSaving}
                                            />
                                        )}
                                    />
                                </Button>
                            </Box>
                            {/* Muestra errores de validación del logo */}
                            {errors.Logotipo && <FormHelperText error sx={{ mt: 1 }}>{errors.Logotipo.message}</FormHelperText>}
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={onClose} sx={{ color: '#bbb' }} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button // O LoadingButton
                        type="submit"
                        loading={isSaving}
                        variant="contained"
                        sx={{
                            fontWeight: 'bold', borderRadius: '8px',
                            background: 'linear-gradient(90deg, #03D000FF, #03D000FF)', // Gradiente azul
                            '&.Mui-disabled': { background: 'rgba(0, 119, 209, 0.5)' },
                            '&:hover': { background: 'linear-gradient(90deg, #03A300FF, #03A300FF)' },
                        }}
                    >
                        {isEditMode ? 'Guardar Cambios' : 'Registrar Empresa'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default EmpresaFormModal;