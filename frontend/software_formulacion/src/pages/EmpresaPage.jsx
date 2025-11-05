import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Button,
    Box,
    Typography,
    CircularProgress,
    Paper, // Usamos Paper para el fondo
    Grid,  // Usamos Grid para distribuir
    Divider,
    useTheme // Para acceder al tema
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PhoneIcon from '@mui/icons-material/Phone';
import AddIcon from '@mui/icons-material/Add';
import FingerprintIcon from '@mui/icons-material/Fingerprint'; // Para RFC
import PersonIcon from '@mui/icons-material/Person'; // Para Contacto
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'; // Para Correo
import EmpresaFormModal from '../components/EmpresaFormModal';
// Ya no necesitamos 'Empresa.css'
// import './styles/Empresa.css';

// URL base del backend Django
const BASE_API_URL = 'http://127.0.0.1:8000';
const API_URL_EMPRESA = `${BASE_API_URL}/api/empresa/`;

// Pequeño componente helper para mostrar la info
const InfoItem = ({ icon, label, value }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ color: theme.palette.text.secondary }}>{icon}</Box>
            <Typography variant="body1" sx={{ ml: 2 }}>
                <Box component="span" sx={{ color: theme.palette.text.secondary, fontWeight: 'medium' }}>
                    {label}:
                </Box>
                <Box component="span" sx={{ ml: 1, color: theme.palette.text.primary }}>
                    {value || 'No especificado'}
                </Box>
            </Typography>
        </Box>
    );
};


function EmpresaPage() {
    const [empresaData, setEmpresaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const theme = useTheme(); // Obtenemos el tema

    // --- (La lógica de fetchEmpresaData, useEffect, handleOpen/CloseModal
    //      sigue siendo exactamente la misma. Es buena lógica.) ---

    const fetchEmpresaData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_URL_EMPRESA);
            let data = null;

            if (Array.isArray(response.data) && response.data.length > 0) {
                data = response.data[0];
            } else if (!Array.isArray(response.data) && response.data) {
                data = response.data;
            }

            if (data) {
                console.log('Datos recibidos de la API:', data);
                setEmpresaData(data);
            } else {
                console.log('No se encontraron datos de la empresa.');
                setEmpresaData(null);
            }
        } catch (err) {
            console.error('Error al obtener datos de la empresa:', err);
            setError(err.message || 'No se pudo conectar a la API.');
            setEmpresaData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmpresaData();
    }, [fetchEmpresaData]);

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);

    // --- RENDERIZADO ---

    // Estado de carga
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Estado sin datos o con error
    if (!empresaData) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: 'calc(100vh - 200px)', // Centrado vertical
                p: 3
            }}>
                <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ color: 'text.secondary' }}>
                    {error ? 'Error al Cargar Datos' : 'Sin Información de Empresa'}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.hint', mb: 3, maxWidth: 400 }}>
                    {error
                        ? `No se pudo obtener la información (${error}). Verifica la conexión o registra la empresa.`
                        : 'Registra los datos de tu empresa para empezar.'}
                </Typography>

                {/* --- BOTÓN CAMBIADO --- */}
                <Button
                    variant="contained"
                    color="success" // Verde
                    startIcon={<AddIcon />}
                    onClick={handleOpenModal}
                    sx={{
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        px: 3,
                        py: 1.2,
                    }}
                >
                    Registrar Empresa
                </Button>

                <EmpresaFormModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSaveSuccess={fetchEmpresaData}
                    empresaToEdit={null}
                />
            </Box>
        );
    }

    // --- ESTADO CON DATOS (EL NUEVO DISEÑO) ---
    return (
        <Paper sx={{
            width: '100%',
            overflow: 'hidden', // Para contener bordes
            borderRadius: '12px' // Bordes redondeados
        }}>
            
            {/* Encabezado con Título y Botón Editar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3, // Padding del encabezado
            }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    <BusinessIcon sx={{ mr: 1.5, verticalAlign: 'middle', fontSize: '2rem' }} />
                    Perfil de la Empresa
                </Typography>

                {/* --- BOTÓN CAMBIADO --- */}
                <Button
                    variant="contained"
                    color="warning"
                    startIcon={<EditIcon />}
                    onClick={handleOpenModal}
                    sx={{ borderRadius: '8px', fontWeight: 'bold' }}
                >
                    Editar Información
                </Button>
            </Box>

            <Divider />

            {/* Contenido principal (Logo + Info) */}
            <Box sx={{ p: 4 }}>
                <Grid container spacing={4}>

                    {/* Columna Izquierda: Logo */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                            Logotipo
                        </Typography>
                        <Box sx={{
                            width: '100%',
                            height: 200,
                            borderRadius: '8px',
                            border: `2px dashed ${theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            backgroundColor: theme.palette.action.hover, // Un fondo sutil
                        }}>
                            {empresaData.logotipo ? (
                                <img
                                    src={`${empresaData.logotipo}`}
                                    alt="Logotipo de la empresa"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => {
                                        e.target.onerror = null; 
                                        e.target.style.display = 'none';
                                        // Crea un placeholder si la imagen falla
                                        e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                             <Box sx={{ 
                                display: empresaData.logotipo ? 'none' : 'flex',
                                color: 'text.secondary' 
                            }}>
                                Sin Logotipo
                            </Box>
                        </Box>
                    </Grid>

                    {/* Columna Derecha: Toda la Información */}
                    <Grid item xs={12} md={8}>
                        {/* Sección de Info General */}
                        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                            Información General
                        </Typography>
                        <InfoItem
                            icon={<FingerprintIcon />}
                            label="RFC"
                            value={empresaData.rfc}
                        />
                        <InfoItem
                            icon={<BusinessIcon />}
                            label="Nombre"
                            value={empresaData.nombre}
                        />

                        <Divider sx={{ my: 3 }} />

                        {/* Sección de Dirección */}
                        <InfoItem
                            icon={<LocationOnIcon />}
                            label="Dirección"
                            value={
                                // Construimos la dirección completa, filtrando partes vacías
                                [
                                    empresaData.calle,
                                    empresaData.colonia ? `Col. ${empresaData.colonia}` : null,
                                    empresaData.ciudad,
                                    empresaData.estado,
                                    empresaData.cp ? `C.P. ${empresaData.cp}` : null
                                ]
                                .filter(Boolean) // Elimina los nulos o strings vacíos
                                .join(', ') // Une todo con comas
                                || 'No especificada' // Fallback por si todo está vacío
                            }
                        />

                        <Divider sx={{ my: 3 }} />

                        {/* Sección de Contacto */}
                        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                            <ContactMailIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                            Contacto
                        </Typography>
                        <InfoItem
                            icon={<PersonIcon />}
                            label="Contacto"
                            value={empresaData.contacto}
                        />
                        <InfoItem
                            icon={<AlternateEmailIcon />}
                            label="Correo"
                            value={empresaData.correo}
                        />
                        <InfoItem
                            icon={<PhoneIcon />}
                            label="Teléfono"
                            value={empresaData.telefono}
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* Modal para editar (sin cambios) */}
            <EmpresaFormModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onSaveSuccess={fetchEmpresaData}
                empresaToEdit={empresaData}
            />
        </Paper>
    );
}

export default EmpresaPage;