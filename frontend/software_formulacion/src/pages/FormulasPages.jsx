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
import CircularProgress from '@mui/material/CircularProgress';

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

    // Función auxiliar para convertir imágenes a base64
    const convertToBase64 = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.error('convertToBase64 error:', err);
            return null;
        }
    };

    // --- EFECTO DE CARGA (useEffect) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            // Se ejecuta solo si la instancia de Axios está lista
            if (!axiosInstance) return;

            setIsLoading(true);
            setError(null);
            try {
                // === CAMBIO 3: Usar axiosInstance en Promise.all ===
                const [ingredientesRes, empresaRes] = await Promise.all([
                    axiosInstance.get(API_URL_INGREDIENTES_REL), // Petición 1 Protegida
                    axiosInstance.get(API_URL_EMPRESA_REL)      // Petición 2 Protegida
                ]);
                // ====================================================

                const dataMapeada = ingredientesRes.data.map(ing => ({
                    id: ing.iding,
                    nombre: ing.nombre
                }));
                setListaIngredientes(dataMapeada);

                if (empresaRes.data && empresaRes.data.length > 0) {
                    let empresaDatos = empresaRes.data[0];

                    // Si existe logotipo como URL, intentar convertirlo a base64
                    if (empresaDatos.logotipo) {
                        // Nota: La función convertToBase64 usa fetch nativo, no axiosInstance,
                        // por lo que no lleva el token. Solo funcionará si la imagen es pública o si Django
                        // devuelve la URL como base64 en la petición inicial.
                        const base64Logo = await convertToBase64(empresaDatos.logotipo);
                        if (base64Logo) {
                            empresaDatos.logotipo = base64Logo;
                        } else {
                            console.warn('No se pudo convertir el logotipo a base64, se dejará la URL original.');
                        }
                    }

                    setEmpresaInfo(empresaDatos);
                } else {
                    console.warn('No se encontraron datos de la empresa para el reporte.');
                    setError('No se pudieron cargar los datos de la empresa.');
                }


            } catch (err) {
                console.error("Error cargando ingredientes o empresa:", err);
                // El Interceptor maneja el 401. Si hay un error aquí, es un fallo de BD o 404/403.
                setError('No se pudieron cargar los datos iniciales.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
        // Añadimos axiosInstance a las dependencias.
    }, [axiosInstance]);

    // --- CÁLCULOS DERIVADOS ---
    const pesoTotalCalculado = useMemo(() => {
        return ingredientes.reduce((total, ing) => total + parseFloat(ing.peso || 0), 0).toFixed(2);
    }, [ingredientes]);

    // --- MANEJADORES DE EVENTOS ---

    // (Lógica de Ingredientes/Fórmula sin cambios)
    const handleDefinirFormula = (e) => {
        e.preventDefault();
        if (formulaData.id && formulaData.nombre) {
            setFormulaDefinida(true);
        } else {
            alert('Por favor, ingresa un ID y Nombre para la fórmula.');
        }
    };

    const handleIngredienteChange = (e) => {
        const { name, value } = e.target;
        setCurrentIngrediente(prev => ({ ...prev, [name]: value }));
    };

    const handleIngredienteSearchChange = (e) => {
        const nombre = e.target.value;
        const ingredienteEncontrado = listaIngredientes.find(ing => ing.nombre === nombre);
        const id = ingredienteEncontrado ? ingredienteEncontrado.id : '';

        setCurrentIngrediente(prev => ({
            ...prev,
            id: id,
            nombre: nombre
        }));
    };

    const handleAddIngrediente = (e) => {
        e.preventDefault();
        if (!currentIngrediente.id || !currentIngrediente.peso || !currentIngrediente.tolerancia) {
            alert('Selecciona un ingrediente VÁLIDO de la lista y define su peso y tolerancia.');
            return;
        }
        setIngredientes([...ingredientes, { ...currentIngrediente }]);
        setCurrentIngrediente({ id: '', nombre: '', peso: '', tolerancia: '' });
    };

    //Función para remover el ingrediente
    const handleRemoveIngrediente = (idToRemove) => {
        setIngredientes(ingredientes.filter(ing => ing.id.toString() !== idToRemove.toString()));
    };

    //Función para editar el ingrediente
    const handleEditIngrediente = (ingredienteAEditar) => {
        // 1. Llenamos los inputs con los datos del ingrediente seleccionado
        setCurrentIngrediente({
            id: ingredienteAEditar.id,
            nombre: ingredienteAEditar.nombre,
            peso: ingredienteAEditar.peso,
            tolerancia: ingredienteAEditar.tolerancia
        });

        // 2. Lo eliminamos de la lista temporalmente
        // Así el usuario puede modificarlo y volver a darle "Agregar" sin duplicarlo.
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
            // === CAMBIO 4: Usar axiosInstance.post ===
            const response = await axiosInstance.post(API_URL_FORMULAS_REL, payload);
            // ==========================================
            console.log('Respuesta de la API:', response.data);
            alert('¡Fórmula registrada exitosamente!');
            handleLimpiarFormulario();
        } catch (err) {
            console.error("Error al registrar la fórmula:", err.response ? err.response.data : err.message);
            setError('No se pudo registrar la fórmula. Revisa la consola para más detalles.');
            alert(`Error: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
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

    // --- MANEJADOR DE DESCARGA DE PDF (sin cambios) ---
    const handleDownloadPdf = () => {
        if (reportePdfRef.current) {
            const element = reportePdfRef.current;
            const pdfFileName = `Formula-${formulaData.id || 'sin-id'}-${formulaData.nombre || 'reporte'}.pdf`;

            const opt = {
                margin: 10,
                filename: pdfFileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(element).set(opt).save();
        } else {
            console.error('No se pudo encontrar el elemento para generar el PDF.');
            alert('Error: No se pudo generar el PDF. Inténtalo de nuevo.');
        }
    };


    return (
        <div className="formula-page">

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
                            placeholder="..."
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={formulaDefinida || isSaving}>
                            <Save /> Seleccionar Ingredientes
                        </button>
                    </div>
                </form>
            </div>

            {/* --- 2. Sección: Selección de Ingredientes --- */}
            <div className={`formula-section ${!formulaDefinida ? 'locked' : ''}`}>
                <h2 className="section-title"><Science /> Paso 2: Agregar Ingredientes</h2>
                <form onSubmit={handleAddIngrediente} className="form-grid-ingredientes">
                    <div className="input-group">
                        <label htmlFor="nombreIngrediente">Nombre del Ingrediente</label>
                        <input
                            list="ingredientes-list"
                            id="nombreIngrediente"
                            name="nombre"
                            value={currentIngrediente.nombre}
                            onChange={handleIngredienteSearchChange}
                            placeholder={isLoading ? "Cargando ingredientes..." : "Busca un ingrediente..."}
                            autoComplete="off"
                            disabled={isLoading || isSaving}
                        />
                        <datalist id="ingredientes-list">
                            {listaIngredientes.map(ing => (
                                <option key={ing.id} data-id={ing.id} value={ing.nombre} />
                            ))}
                        </datalist>
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
                                        <td style={{textAlign:'right'}}>{ing.peso}</td>
                                        <td style={{textAlign:'right'}}>{ing.tolerancia}%</td>
                                        <td className="table-actions">
                                            <button className="btn-icon btn-icon-edit" disabled={isSaving} onClick={() => handleEditIngrediente(ing)}>
                                                <Edit />
                                            </button>
                                            <button
                                                className="btn-icon btn-icon-delete"
                                                onClick={() => handleRemoveIngrediente(ing.id)}
                                                disabled={isSaving}
                                            >
                                                <Delete />
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
                        <span className="summary-value">{pesoTotalCalculado} Kg</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Total de Ingredientes</span>
                        <span className="summary-value">{ingredientes.length}</span>
                    </div>
                </div>
                <div className="form-actions-final">
                    <button
                        className="btn btn-default"
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