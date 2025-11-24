import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Divider } from '@mui/material';
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

    const { handleSubmit, control, reset, watch, formState: { errors } } = useForm({
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
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: '#1e1e1e',
                    color: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0px 10px 40px rgba(0,0,0,0.5)',
                },
            }}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* --- CABECERA --- */}
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                        {isEditMode ? 'Editar Empresa' : 'Registrar Empresa'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
                        Complete la información fiscal y de contacto de la organización.
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ py: 3 }}>

                    {/* --- SECCIÓN 1: DATOS FISCALES --- */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#03D000FF',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                mb: 2
                            }}
                        >
                            Datos Fiscales
                        </Typography>

                        <Grid container spacing={3}>
                            {/* RFC */}
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="rfc"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="RFC"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving || isEditMode}
                                            error={!!errors.rfc}
                                            helperText={errors.rfc?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                    '&:hover fieldset': { borderColor: '#fff' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Nombre Empresa */}
                            <Grid item xs={12} sm={8}>
                                <Controller
                                    name="nombre"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Razón Social / Nombre"
                                            fullWidth
                                            style={{
                                                width : '490px'
                                            }}
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.nombre}
                                            helperText={errors.nombre?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                    '&:hover fieldset': { borderColor: '#fff' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 4 }} />

                    {/* --- SECCIÓN 2: UBICACIÓN --- */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#03D000FF',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                mb: 2
                            }}
                        >
                            Ubicación
                        </Typography>

                        <Grid container spacing={3}>
                            {/* Calle */}
                            <Grid item xs={12} sm={8}>
                                <Controller
                                    name="calle"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Calle y Número"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.calle}
                                            helperText={errors.calle?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Colonia */}
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="colonia"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Colonia"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.colonia}
                                            helperText={errors.colonia?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Ciudad */}
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="ciudad"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Ciudad"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.ciudad}
                                            helperText={errors.ciudad?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Estado */}
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="estado"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Estado"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.estado}
                                            helperText={errors.estado?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* CP */}
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="cp"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="C.P."
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.cp}
                                            helperText={errors.cp?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 4 }} />

                    {/* --- SECCIÓN 3: CONTACTO --- */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#03D000FF',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                mb: 2
                            }}
                        >
                            Contacto
                        </Typography>

                        <Grid container spacing={3}>
                            {/* Nombre Contacto */}
                            <Grid item xs={12}>
                                <Controller
                                    name="contacto"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Nombre Completo del Responsable"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.contacto}
                                            helperText={errors.contacto?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Teléfono */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="telefono"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Teléfono"
                                            fullWidth
                                            variant="outlined"
                                            disabled={isSaving}
                                            error={!!errors.telefono}
                                            helperText={errors.telefono?.message}
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Correo */}
                            <Grid item xs={12} sm={6}>
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
                                            InputLabelProps={{ sx: { color: '#aaa' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#fff',
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 4 }} />

                    {/* --- SECCIÓN 4: BRANDING / LOGO --- */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#03D000FF',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                mb: 2
                            }}
                        >
                            Branding
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: 'center',
                                gap: 4,
                                p: 3,
                                border: '1px dashed rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255,255,255,0.02)',
                                transition: '0.3s',
                                '&:hover': {
                                    borderColor: '#03D000FF',
                                    backgroundColor: 'rgba(3, 208, 0, 0.05)'
                                }
                            }}
                        >
                            {/* Previsualización */}
                            <Avatar
                                src={logoPreview || undefined}
                                variant="rounded"
                                sx={{
                                    width: 100,
                                    height: 100,
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <BusinessIcon sx={{ color: '#666', fontSize: 40 }} />
                            </Avatar>

                            {/* Botón de Carga */}
                            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        color: '#fff',
                                        borderColor: 'rgba(255,255,255,0.3)',
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        mb: 1,
                                        '&:hover': {
                                            borderColor: '#03D000FF',
                                            color: '#03D000FF',
                                            backgroundColor: 'transparent'
                                        }
                                    }}
                                >
                                    {isEditMode && logoPreview ? 'Cambiar Logotipo' : 'Subir Logotipo'}
                                    <Controller
                                        name="logotipo"
                                        control={control}
                                        render={({ field: { onChange, onBlur, name, ref } }) => (
                                            <VisuallyHiddenInput
                                                type="file"
                                                accept="image/*"
                                                onBlur={onBlur}
                                                name={name}
                                                ref={ref}
                                                onChange={(e) => onChange(e.target.files)}
                                            />
                                        )}
                                    />
                                </Button>

                                <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                                    Formato recomendado: PNG transparente.
                                </Typography>

                                {/* Error del Logo */}
                                {errors.logotipo && (
                                    <FormHelperText error sx={{ mt: 1 }}>
                                        {errors.logotipo.message}
                                    </FormHelperText>
                                )}
                            </Box>
                        </Box>
                    </Box>

                </DialogContent>

                {/* --- PIE DE PÁGINA (ACCIONES) --- */}
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            color: '#aaa',
                            mr: 2,
                            textTransform: 'none',
                            '&:hover': { color: '#fff' }
                        }}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        variant="contained"
                        sx={{
                            bgcolor: '#03D000FF',
                            color: '#fff',
                            fontWeight: 'bold',
                            px: 4,
                            textTransform: 'none',
                            boxShadow: '0 0 10px rgba(3, 208, 0, 0.3)',
                            '&:hover': {
                                bgcolor: '#02a100',
                                boxShadow: '0 0 20px rgba(3, 208, 0, 0.5)',
                            }
                        }}
                    >
                        {isSaving ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Registrar Empresa')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default EmpresaFormModal;