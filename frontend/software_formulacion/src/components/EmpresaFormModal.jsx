import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Grid, Box, Typography, FormHelperText, Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BusinessIcon from '@mui/icons-material/Business';

const API_URL_EMPRESA_REL = '/empresa/';

// --- CONFIGURACIÓN DE URLS PARA IMÁGENES ---
const API_URL = import.meta.env.VITE_API_URL;
const BASE_IMAGE_URL = import.meta.env.VITE_BACKEND_URL;

// --- Esquema de Validación ---
const validationSchema = yup.object().shape({
    // MODIFICADO: RFC limitado a 16 caracteres
    rfc: yup.string()
        .required('El RFC es obligatorio')
        .max(16, 'El RFC no puede tener más de 16 caracteres'),
    nombre: yup.string().required('El nombre es obligatorio'),
    calle: yup.string().required('La calle es obligatoria'),
    colonia: yup.string().required('La colonia es obligatoria'),
    ciudad: yup.string().required('La ciudad es obligatoria'),
    estado: yup.string().required('El estado es obligatorio'),
    // MODIFICADO: CP limitado a 5 dígitos numéricos
    cp: yup.string()
        .required('El Código Postal es obligatorio')
        .matches(/^[0-9]+$/, "Solo se permiten números")
        .length(5, "El C.P. debe tener exactamente 5 dígitos"),
    contacto: yup.string().required('El nombre de contacto es obligatorio'),
    correo: yup.string().email('Correo inválido').required('El correo es obligatorio'),
    telefono: yup.string()
        .required('El teléfono es obligatorio')
        .matches(/^[0-9]+$/, "Solo se permiten números")
        .length(10, "El Número de telefono debe tener 10 digitos"),
    logotipo: yup.mixed()
        .nullable()
        .test('fileSize', 'El archivo es muy grande (máx 2MB)', value => {
            if (!value || value.length === 0) return true;
            return value[0].size <= 2097152;
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
    const { axiosInstance } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const isEditMode = empresaToEdit !== null;

    const { handleSubmit, control, reset, watch, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            rfc: '', nombre: '', calle: '', colonia: '', ciudad: '', estado: '',
            cp: '', contacto: '', correo: '', telefono: '', logotipo: null,
        }
    });

    const logoFile = watch('logotipo');

    // --- EFECTO: CARGAR DATOS AL ABRIR ---
    useEffect(() => {
        if (open) {
            if (isEditMode && empresaToEdit) {
                reset({
                    rfc: empresaToEdit.RFC || empresaToEdit.rfc || '',
                    nombre: empresaToEdit.Nombre || empresaToEdit.nombre || '',
                    calle: empresaToEdit.Calle || empresaToEdit.calle || '',
                    colonia: empresaToEdit.Colonia || empresaToEdit.colonia || '',
                    ciudad: empresaToEdit.Ciudad || empresaToEdit.ciudad || '',
                    estado: empresaToEdit.Estado || empresaToEdit.estado || '',
                    cp: empresaToEdit.CP || empresaToEdit.cp || '',
                    contacto: empresaToEdit.Contacto || empresaToEdit.contacto || '',
                    correo: empresaToEdit.Correo || empresaToEdit.correo || '',
                    telefono: empresaToEdit.Telefono || empresaToEdit.telefono || '',
                    logotipo: null,
                });

                const rutaLogo = empresaToEdit.Logotipo || empresaToEdit.logotipo;

                if (rutaLogo) {
                    setLogoPreview(`${BASE_IMAGE_URL}/${rutaLogo}`);
                } else {
                    setLogoPreview(null);
                }
            } else {
                // MODO CREAR: Limpiar todo
                reset({
                    rfc: '', nombre: '', calle: '', colonia: '', ciudad: '', estado: '',
                    cp: '', contacto: '', correo: '', telefono: '', logotipo: null,
                });
                setLogoPreview(null);
            }
        }
    }, [empresaToEdit, open, reset, isEditMode]);

    // --- EFECTO: ACTUALIZAR PREVIEW AL SELECCIONAR ARCHIVO ---
    useEffect(() => {
        if (logoFile && logoFile.length > 0) {
            const file = logoFile[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else if (isEditMode && !logoFile) {
            const rutaLogo = empresaToEdit?.Logotipo || empresaToEdit?.logotipo;
            if (rutaLogo) {
                setLogoPreview(`${BASE_IMAGE_URL}/${rutaLogo}`);
            }
        }
    }, [logoFile, isEditMode, empresaToEdit]);


    // --- FUNCIÓN ONSUBMIT ---
    const onSubmit = async (data) => {
        setIsSaving(true);
        let success = false;

        const formDataToSend = new FormData();

        // Agregamos campos de texto
        Object.keys(data).forEach(key => {
            if (key !== 'logotipo' && data[key] !== null && data[key] !== undefined) {
                formDataToSend.append(key, data[key]);
            }
        });

        // Agregamos archivo SOLO si existe uno nuevo
        if (data.logotipo && data.logotipo.length > 0) {
            formDataToSend.append('logotipo', data.logotipo[0]);
        }

        try {
            let response;
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (isEditMode) {
                // Usamos el RFC original guardado en empresaToEdit para la URL, 
                // permitiendo que data.rfc (el nuevo) vaya en el cuerpo de la petición.
                const idParaEditar = empresaToEdit.RFC || empresaToEdit.rfc;

                response = await axiosInstance.put(`${API_URL_EMPRESA_REL}${idParaEditar}`, formDataToSend, config);
            } else {
                response = await axiosInstance.post(API_URL_EMPRESA_REL, formDataToSend, config);
            }

            console.log('Operación exitosa:', response.data);
            success = true;
        } catch (error) {
            console.error('Error al guardar:', error.response?.data || error.message);
            success = false;
        } finally {
            setIsSaving(false);
            if (success) {
                onSaveSuccess();
                onClose();
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
                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                    color: 'text.primary',
                    borderRadius: '16px',
                },
            }}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                    <Typography variant="h5" component="div" fontWeight="800" sx={{ color: 'text.primary' }}>
                        {isEditMode ? 'Editar Empresa' : 'Registrar Empresa'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Información fiscal y general de la organización.
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ py: 4 }}>
                    {/* --- SECCIÓN 1: DATOS FISCALES --- */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2, display: 'block' }}>
                            Datos Fiscales
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="rfc"
                                    control={control}
                                    render={({ field }) => (
                                        // MODIFICADO: Se habilitó la edición y se puso límite de 16 chars
                                        <TextField
                                            {...field}
                                            label="RFC"
                                            fullWidth
                                            disabled={isSaving} // Ya es editable
                                            inputProps={{ maxLength: 16 }}
                                            error={!!errors.rfc}
                                            helperText={errors.rfc?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <Controller
                                    name="nombre"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Razón Social / Nombre" fullWidth disabled={isSaving}
                                            error={!!errors.nombre} helperText={errors.nombre?.message} />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* --- SECCIÓN 2: UBICACIÓN --- */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2, display: 'block' }}>
                            Ubicación
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <Controller
                                    name="calle"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Calle y Número" fullWidth disabled={isSaving}
                                            error={!!errors.calle} helperText={errors.calle?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="colonia"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Colonia" fullWidth disabled={isSaving}
                                            error={!!errors.colonia} helperText={errors.colonia?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="ciudad"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Ciudad" fullWidth disabled={isSaving}
                                            error={!!errors.ciudad} helperText={errors.ciudad?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="estado"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Estado" fullWidth disabled={isSaving}
                                            error={!!errors.estado} helperText={errors.estado?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="cp"
                                    control={control}
                                    render={({ field }) => (
                                        // MODIFICADO: Filtro para solo números y max 5 dígitos
                                        <TextField
                                            {...field}
                                            label="C.P."
                                            fullWidth
                                            disabled={isSaving}
                                            inputProps={{ maxLength: 5 }}
                                            onChange={(e) => {
                                                // Reemplaza cualquier caracter que no sea número
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                field.onChange(value);
                                            }}
                                            error={!!errors.cp}
                                            helperText={errors.cp?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* --- SECCIÓN 3: CONTACTO --- */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2, display: 'block' }}>
                            Contacto
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Controller
                                    name="contacto"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Nombre Completo del Responsable" fullWidth disabled={isSaving}
                                            error={!!errors.contacto} helperText={errors.contacto?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="correo"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Correo Electrónico" type="email" fullWidth disabled={isSaving}
                                            error={!!errors.correo} helperText={errors.correo?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="telefono"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Teléfono" fullWidth disabled={isSaving} inputProps={{ maxLength: 10 }}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                field.onChange(value);
                                            }}
                                            error={!!errors.telefono} helperText={errors.telefono?.message} />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* --- SECCIÓN 4: BRANDING (LOGO) --- */}
                    <Box>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2, display: 'block' }}>
                            Branding
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 4, p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>

                            {/* Previsualización del Logo */}
                            <Avatar
                                src={logoPreview || undefined}
                                variant="rounded"
                                sx={{ width: 100, height: 100, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', p: 1, objectFit: 'contain' }}
                            >
                                <BusinessIcon sx={{ color: 'text.disabled', fontSize: 40 }} />
                            </Avatar>

                            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 'bold', mb: 1 }}>
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
                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                    Formato recomendado: PNG transparente.
                                </Typography>
                                {errors.logotipo && (
                                    <FormHelperText error sx={{ mt: 1 }}>{errors.logotipo.message}</FormHelperText>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={onClose} disabled={isSaving} sx={{ color: 'text.secondary', mr: 2, textTransform: 'none' }}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving} variant="contained" sx={{ backgroundColor: '#03D000FF', color: '#fff', fontWeight: 'bold', px: 4, borderRadius: '8px', textTransform: 'none', '&:hover': { backgroundColor: '#02a100' } }}>
                        {isSaving ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Registrar Empresa')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default EmpresaFormModal;