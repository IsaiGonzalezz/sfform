import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import html2pdf from 'html2pdf.js';
import ReporteFormula from '../components/ReporteFormula';
import ConsultarFormulasModal from '../components/ConsultarFormulasModal';
import './styles/Formula.css';
import '../components/styles/Reporte.css'
import {
    ReceiptLong, Science, PlaylistAddCheck,
    Save, Add, Edit, Delete, ClearAll, PictureAsPdf,
} from '@mui/icons-material';
import { Check, AlertCircle } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';

// --- NUEVOS IMPORTS PARA EL SELECT MEJORADO (AUTOCOMPLETE) ---
import { Autocomplete, TextField } from '@mui/material';

// --- URLs RELATIVAS
const API_URL_FORMULAS_REL = '/formulas/';
const API_URL_INGREDIENTES_REL = '/ingredientes/';
const API_URL_EMPRESA_REL = '/empresa/';
// -----------------------------------------------------------

export default function FormulaPage() {
    const { axiosInstance } = useAuth();
    const reportePdfRef = useRef(null);

    // --- ESTADOS PRINCIPALES ---
    const [formulaDefinida, setFormulaDefinida] = useState(false);
    const [ingredientes, setIngredientes] = useState([]);

    const [formulaData, setFormulaData] = useState({
        id: '',
        nombre: '',
    });

    const [currentIngrediente, setCurrentIngrediente] = useState({
        id: '',
        nombre: '',
        peso: '',
        tolerancia: ''
    });

    // --- ESTADOS DE CARGA Y DATOS ---
    const [listaIngredientes, setListaIngredientes] = useState([]);
    const [empresaInfo, setEmpresaInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showConsultar, setShowConsultar] = useState(false);
    const [error, setError] = useState(null);

    // --- ESTADO NOTIFICACIÓN TOAST ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- FUNCIÓN TOAST ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // --- FORMATO DE NÚMEROS ---
    const formatearValor = (valor) => {
        const numero = parseFloat(valor);
        if (isNaN(numero)) return '0.00';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numero);
    };

    // --- EFECTO DE CARGA (useEffect) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!axiosInstance) return;

            setIsLoading(true);
            setError(null);
            try {
                const [ingredientesRes, empresaRes] = await Promise.all([
                    axiosInstance.get(API_URL_INGREDIENTES_REL),
                    axiosInstance.get(API_URL_EMPRESA_REL)
                ]);

                // 2. ORDENAR ALFABÉTICAMENTE LOS INGREDIENTES
                const dataMapeada = ingredientesRes.data
                    .map(ing => ({
                        id: ing.iding,
                        nombre: ing.nombre
                    }))
                    .sort((a, b) => a.nombre.localeCompare(b.nombre)); // Orden A-Z

                setListaIngredientes(dataMapeada);

                if (empresaRes.data && empresaRes.data.length > 0) {
                    let empresaDatos = empresaRes.data[0];
                    setEmpresaInfo(empresaDatos);
                } else {
                    console.warn('No se encontraron datos de la empresa para el reporte.');
                }

            } catch (err) {
                console.error("Error cargando ingredientes o empresa:", err);
                showToast('Error al cargar datos del servidor', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [axiosInstance]);

    // --- CÁLCULOS DERIVADOS ---
    const pesoTotalCalculado = useMemo(() => {
        return ingredientes.reduce((total, ing) => total + parseFloat(ing.peso || 0), 0).toFixed(2);
    }, [ingredientes]);

    // --- MANEJADORES DE EVENTOS ---
    const handleDefinirFormula = (e) => {
        e.preventDefault();
        if (formulaData.id && formulaData.nombre) {
            setFormulaDefinida(true);
        } else {
            showToast('Por favor, ingresa un ID y Nombre para la fórmula.', 'error');
        }
    };

    const handleIngredienteChange = (e) => {
        const { name, value } = e.target;
        setCurrentIngrediente(prev => ({ ...prev, [name]: value }));
    };

    // 1. y 3. MANEJADOR DEL SELECT MEJORADO (Autocomplete)
    const handleIngredienteSelect = (event, newValue) => {
        // Si el usuario limpia el campo (newValue es null)
        if (!newValue) {
            setCurrentIngrediente(prev => ({ ...prev, id: '', nombre: '' }));
            return;
        }

        // 3. VALIDACIÓN DE DUPLICADOS CON TOAST
        const yaExiste = ingredientes.some(ing => String(ing.id) === String(newValue.id));

        if (yaExiste) {
            showToast(`El ingrediente "${newValue.nombre}" ya está agregado en la lista.`, 'error');
            // No actualizamos el estado, por lo que el select no cambiará o se limpiará según configuración
            return;
        }

        // Si no existe, lo seleccionamos
        setCurrentIngrediente(prev => ({
            ...prev,
            id: newValue.id,
            nombre: newValue.nombre
        }));
    };

    const handleAddIngrediente = (e) => {
        e.preventDefault();
        if (!currentIngrediente.id || !currentIngrediente.peso || !currentIngrediente.tolerancia) {
            showToast('Selecciona un ingrediente válido y define peso/tolerancia.', 'error');
            return;
        }
        setIngredientes([...ingredientes, { ...currentIngrediente }]);
        // Limpiamos el input para agregar otro
        setCurrentIngrediente({ id: '', nombre: '', peso: '', tolerancia: '' });
    };

    const handleRemoveIngrediente = (idToRemove) => {
        setIngredientes(ingredientes.filter(ing => ing.id.toString() !== idToRemove.toString()));
    };

    const handleEditIngrediente = (ingredienteAEditar) => {
        setCurrentIngrediente({
            id: ingredienteAEditar.id,
            nombre: ingredienteAEditar.nombre,
            peso: ingredienteAEditar.peso,
            tolerancia: ingredienteAEditar.tolerancia
        });
        handleRemoveIngrediente(ingredienteAEditar.id);
    };

    // --- FUNCIÓN DE ESCRITURA (POST) ---
    const handleRegistrarFormula = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        const ingredientesPayload = ingredientes.map(ing => ({
            iding: ing.id,
            cantidad: parseFloat(ing.peso),
            tolerancia: parseInt(ing.tolerancia)
        }));

        const payload = {
            idform: formulaData.id,
            nombre: formulaData.nombre,
            ingredientes: ingredientesPayload
        };

        try {
            const response = await axiosInstance.post(API_URL_FORMULAS_REL, payload);
            console.log('Respuesta de la API:', response.data);
            
            showToast('¡Fórmula registrada exitosamente!');
            
            handleLimpiarFormulario();
        } catch (err) {
            console.error("Error al registrar la fórmula:", err.response ? err.response.data : err.message);
            const msg = err.response ? JSON.stringify(err.response.data) : "Error desconocido al guardar";
            showToast(`Error: ${msg}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLimpiarFormulario = () => {
        setFormulaDefinida(false);
        setIngredientes([]);
        setFormulaData({ id: '', nombre: '' });
        setCurrentIngrediente({ id: '', nombre: '', peso: '', tolerancia: '' });
        setError(null);
        setIsSaving(false);
    };

    const handleFormulaChange = (e) => {
        const { name, value } = e.target;
        setFormulaData(prev => ({ ...prev, [name]: value }));
    };

    const handleDownloadPdf = () => {
        if (reportePdfRef.current) {
            const element = reportePdfRef.current;
            const pdfFileName = `Formula-${formulaData.id || 'sin-id'}-${formulaData.nombre || 'reporte'}.pdf`;

            const opt = {
                margin: 10,
                filename: pdfFileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true, 
                    logging: true
                },
                jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().from(element).set(opt).save();
        } else {
            console.error('No se pudo encontrar el elemento para generar el PDF.');
            showToast('Error: No se pudo generar el PDF.', 'error');
        }
    };


    return (
        <div className="formula-page" style={{ position: 'relative' }}> 

            {/* --- RENDERIZADO DEL TOAST --- */}
            {toast.show && (
                <div style={{
                    ...toastStyles.toast,
                    backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: toast.type === 'error' ? '#991b1b' : '#15803d',
                    borderColor: toast.type === 'error' ? '#fecaca' : '#bbf7d0',
                }}>
                    <div style={{
                        ...toastStyles.toastIconContainer,
                        backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e',
                    }}>
                        {toast.type === 'error' ? <AlertCircle size={16} color="#fff" /> : <Check size={16} color="#fff" strokeWidth={3} />}
                    </div>
                    {toast.message}
                </div>
            )}

            {/* --- 0. Barra de Acciones Globales --- */}
            <div className="action-bar">
                <button className="btn btn-default" onClick={handleLimpiarFormulario} disabled={isSaving}>
                    <ClearAll /> Limpiar Formulario
                </button>
                <button className="btn btn-edit" disabled={isSaving} onClick={() => setShowConsultar(true)}>
                    <Edit /> Consultar Formulas
                </button>
            </div>

            {/* --- 1. Sección: Definición de Fórmula --- */}
            <div className={`formula-section ${formulaDefinida ? 'locked' : ''}`}>
                <h2 className="section-title"><ReceiptLong /> Paso 1: Definir Fórmula</h2>
                <form onSubmit={handleDefinirFormula} className="form-grid">
                    <div className="input-group">
                        <label htmlFor="idFormula">Id Fórmula</label>
                        <input
                            type="text"
                            id="idFormula"
                            name="id"
                            value={formulaData.id}
                            onChange={handleFormulaChange}
                            disabled={formulaDefinida || isSaving}
                            placeholder="Ej: FRM-001"
                            required
                        />
                    </div>
                    <div className="input-group input-span-2">
                        <label htmlFor="nombreFormula">Nombre de la Fórmula</label>
                        <input
                            type="text"
                            id="nombreFormula"
                            name="nombre"
                            value={formulaData.nombre}
                            onChange={handleFormulaChange}
                            disabled={formulaDefinida || isSaving}
                            placeholder="Ej: Agua Destilada"
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={formulaDefinida || isSaving} style={{ width: '100%' }}>
                            <Save /> Seleccionar Ingredientes
                        </button>
                    </div>
                </form>
            </div>

            {/* --- 2. Sección: Selección de Ingredientes (MODIFICADA CON AUTOCOMPLETE) --- */}
            <div className={`formula-section ${!formulaDefinida ? 'locked' : ''}`}>
                <h2 className="section-title"><Science /> Paso 2: Agregar Ingredientes</h2>
                <form onSubmit={handleAddIngrediente} className="form-grid-ingredientes">
                    <div className="input-group">
                        <label htmlFor="nombreIngrediente">Nombre del Ingrediente</label>
                        
                        {/* 1. SELECTOR MEJORADO TIPO SELECT2 (AUTOCOMPLETE) */}
                        <Autocomplete
                            id="nombreIngrediente"
                            options={listaIngredientes}
                            getOptionLabel={(option) => option.nombre || ''}
                            // Encontramos el objeto completo basado en el ID actual
                            value={listaIngredientes.find(ing => String(ing.id) === String(currentIngrediente.id)) || null}
                            onChange={handleIngredienteSelect}
                            disabled={isLoading || isSaving}
                            noOptionsText="No se encontró el ingrediente"
                            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    placeholder={isLoading ? "Cargando..." : "Buscar ingrediente..."}
                                    variant="outlined"
                                    size="small"
                                    // Ajustamos estilos para que se parezca a tus inputs originales
                                    sx={{
                                        backgroundColor: 'var(--bg-color)',
                                        '& .MuiOutlinedInput-root': {
                                            color: 'var(--text-color)', // Texto claro
                                            borderRadius: '8px',
                                            '& fieldset': { borderColor: '#444' }, // Borde normal
                                            '&:hover fieldset': { borderColor: '#666' }, // Borde hover
                                            '&.Mui-focused fieldset': { borderColor: '#1B609DFF' }, // Borde focus
                                        },
                                        '& .MuiInputLabel-root': { color: '#888' },
                                        '& .MuiSvgIcon-root': { color: '#888' } // Icono flecha
                                    }}
                                />
                            )}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="pesoIngrediente">Peso Objetivo (Kg)</label>
                        <input
                            type="number"
                            id="pesoIngrediente"
                            name="peso"
                            value={currentIngrediente.peso}
                            onChange={handleIngredienteChange}
                            placeholder="Ej: 250"
                            disabled={isSaving}
                            step="0.001"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="toleranciaIngrediente">Tolerancia (%)</label>
                        <input
                            type="number"
                            id="toleranciaIngrediente"
                            name="tolerancia"
                            value={currentIngrediente.tolerancia}
                            onChange={handleIngredienteChange}
                            placeholder="Ej: 10"
                            disabled={isSaving}
                            step="0.1"
                        />
                    </div>
                    <div className="form-actions-ingredientes">
                        <button type="submit" className="btn btn-warning" disabled={isSaving}>
                            <Add /> Agregar Ingrediente
                        </button>
                    </div>
                </form>
                
                <h3 className="subsection-title">Ingredientes Agregados</h3>
                <div className="table-wrapper">
                    <table className="ingredient-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th style={{textAlign:'right'}}>Peso (Kg)</th>
                                <th style={{textAlign:'right'}}>Tolerancia (%)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingredientes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', color: '#777' }}>
                                        Aún no hay ingredientes en la fórmula.
                                    </td>
                                </tr>
                            ) : (
                                ingredientes.map((ing, index) => (
                                    <tr key={index}>
                                        <td>{ing.id}</td>
                                        <td>{ing.nombre}</td>
                                        <td style={{textAlign:'right'}}>{formatearValor(ing.peso)}</td>
                                        <td style={{textAlign:'right'}}>{ing.tolerancia}%</td>
                                        <td className="table-actions">
                                            <button className="btn-icon btn-icon-edit" disabled={isSaving} onClick={() => handleEditIngrediente(ing)}>
                                                <Edit 
                                                    style={{
                                                        backgroundColor: '#1B609DFF',
                                                        borderRadius: '8px',
                                                        padding: '6px',
                                                        color: '#FFFFFF',
                                                        fontSize: '32px'
                                                    }}
                                                />
                                            </button>
                                            <button
                                                className="btn-icon btn-icon-delete"
                                                onClick={() => handleRemoveIngrediente(ing.id)}
                                                disabled={isSaving}
                                            >
                                                <Delete 
                                                    style={{
                                                        backgroundColor: '#9D1B1BFF',
                                                        borderRadius: '8px',
                                                        padding: '6px',
                                                        color: '#FFFFFF',
                                                        fontSize: '32px'
                                                    }}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 3. Sección: Resumen y Registro --- */}
            <div className={`formula-section ${!formulaDefinida ? 'locked' : ''}`}>
                <h2 className="section-title"><PlaylistAddCheck /> Paso 3: Resumen y Registro</h2>
                {error && (
                    <div className="error-box">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                <div className="summary-grid">
                    <div className="summary-card">
                        <span className="summary-label">Peso Total Calculado</span>
                        <span className="summary-value">{formatearValor(pesoTotalCalculado)} Kg</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Total de Ingredientes</span>
                        <span className="summary-value">{ingredientes.length}</span>
                    </div>
                </div>
                <div className="form-actions-final">
                    <button
                        className="btn btn-danger"
                        disabled={ingredientes.length === 0 || isSaving}
                        onClick={handleDownloadPdf}
                    >
                        <PictureAsPdf /> Descargar PDF
                    </button>
                    <button
                        className="btn btn-primary"
                        disabled={ingredientes.length === 0 || isSaving}
                        onClick={handleRegistrarFormula}
                    >
                        {isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        {isSaving ? 'Registrando...' : 'Registrar Fórmula Completa'}
                    </button>
                </div>
            </div>

            {/* --- COMPONENTE DE REPORTE OCULTO (PARA PDF) --- */}
            <div className="pdf-hidden-container">
                <ReporteFormula
                    ref={reportePdfRef}
                    formula={formulaData}
                    ingredientes={ingredientes}
                    empresa={empresaInfo}
                />
            </div>
            <ConsultarFormulasModal 
                isOpen={showConsultar} 
                onClose={() => setShowConsultar(false)} 
            />
        </div>
    );
}

// --- ESTILOS DE TOAST ---
const toastStyles = {
    toast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#fff', 
        color: '#333', 
        padding: '12px 24px',
        borderRadius: '50px', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: '600',
        fontSize: '0.95rem',
        zIndex: 9999,
        border: '1px solid #ddd',
        animation: 'slideIn 0.3s ease-out'
    },
    toastIconContainer: {
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};