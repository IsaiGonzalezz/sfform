import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js'; // <-- IMPORTAR html2pdf
import ReporteFormula from '../components/ReporteFormula';
import './styles/Formula.css';
import '../components/styles/Reporte.css'
import {
    ReceiptLong, Science, PlaylistAddCheck,
    Save, Add, Edit, Delete, ClearAll, PictureAsPdf, // Cambiado Print por PictureAsPdf
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';

// --- URLs de la API ---
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const API_URL_FORMULAS = `${API_BASE_URL}/formulas/`;
const API_URL_INGREDIENTES = `${API_BASE_URL}/ingredientes/`;
const API_URL_EMPRESA = `${API_BASE_URL}/empresa/`;

export default function FormulaPage() {

    // --- NUEVO: Ref para el componente del reporte que se convertirá en PDF ---
    const reportePdfRef = useRef(null);

    // --- ESTADOS PRINCIPALES ---
    const [formulaDefinida, setFormulaDefinida] = useState(false);
    const [ingredientes, setIngredientes] = useState([]);

    const [formulaData, setFormulaData] = useState({
        id: '',
        folio: '',
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
    const [error, setError] = useState(null);

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
            setIsLoading(true);
            setError(null);
            try {

                const [ingredientesRes, empresaRes] = await Promise.all([
                    axios.get(API_URL_INGREDIENTES),
                    axios.get(API_URL_EMPRESA)
                ]);

                const dataMapeada = ingredientesRes.data.map(ing => ({
                    id: ing.iding,
                    nombre: ing.nombre // <-- CORREGIDO
                }));
                setListaIngredientes(dataMapeada);

                if (empresaRes.data && empresaRes.data.length > 0) {
                    let empresaDatos = empresaRes.data[0];

                    // Si existe logotipo como URL, intentar convertirlo a base64
                    if (empresaDatos.logotipo) {
                        const base64Logo = await convertToBase64(empresaDatos.logotipo);
                        if (base64Logo) {
                            empresaDatos.logotipo = base64Logo;
                        } else {
                            // Si falla la conversión dejamos la URL original (se intentará con useCORS)
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
                setError('No se pudieron cargar los datos iniciales.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // --- CÁLCULOS DERIVADOS ---
    const pesoTotalCalculado = useMemo(() => {
        return ingredientes.reduce((total, ing) => total + parseFloat(ing.peso || 0), 0).toFixed(2);
    }, [ingredientes]);

    // --- MANEJADORES DE EVENTOS ---

    const handleDefinirFormula = (e) => {
        e.preventDefault();
        if (formulaData.id && formulaData.folio && formulaData.nombre) {
            setFormulaDefinida(true);
        } else {
            alert('Por favor, ingresa un ID, Folio y Nombre para la fórmula.');
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

    const handleRemoveIngrediente = (idToRemove) => {
        setIngredientes(ingredientes.filter(ing => ing.id.toString() !== idToRemove.toString()));
    };

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
            folio: formulaData.folio,
            nombre: formulaData.nombre,
            ingredientes: ingredientesPayload
        };

        try {
            const response = await axios.post(API_URL_FORMULAS, payload);
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
        setFormulaData({ id: '', folio: '', nombre: '' });
        setCurrentIngrediente({ id: '', nombre: '', peso: '', tolerancia: '' });
        setError(null);
        setIsSaving(false);
    };

    const handleFormulaChange = (e) => {
        const { name, value } = e.target;
        setFormulaData(prev => ({ ...prev, [name]: value }));
    };

    // --- NUEVO: MANEJADOR DE DESCARGA DE PDF ---
    const handleDownloadPdf = () => {
        if (reportePdfRef.current) {
            const element = reportePdfRef.current;
            const pdfFileName = `Formula-${formulaData.id || 'sin-id'}-${formulaData.nombre || 'reporte'}.pdf`;

            // Opciones de html2pdf
            const opt = {
                margin: 10,
                filename: pdfFileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 }, // Aumenta la escala para mejor resolución
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Generar y descargar el PDF
            html2pdf().from(element).set(opt).save();
        } else {
            console.error('No se pudo encontrar el elemento para generar el PDF.');
            alert('Error: No se pudo generar el PDF. Inténtalo de nuevo.');
        }
    };


    return (
        <div className="formula-page"> {/* Ya no necesita 'print-hide' */}

            {/* --- 0. Barra de Acciones Globales --- */}
            <div className="action-bar">
                <button className="btn btn-default" onClick={handleLimpiarFormulario} disabled={isSaving}>
                    <ClearAll /> Limpiar Formulario
                </button>
                <button className="btn btn-default" disabled={isSaving}>
                    <Edit /> Editar Fórmula Existente
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
                    <div className="input-group">
                        <label htmlFor="folioFormula">Folio</label>
                        <input
                            type="text"
                            id="folioFormula"
                            name="folio"
                            value={formulaData.folio}
                            onChange={handleFormulaChange}
                            disabled={formulaDefinida || isSaving}
                            placeholder="Ej: FL-2025-01"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="nombreFormula">Nombre de la Fórmula</label>
                        <input
                            type="text"
                            id="nombreFormula"
                            name="nombre"
                            value={formulaData.nombre}
                            onChange={handleFormulaChange}
                            disabled={formulaDefinida || isSaving}
                            placeholder="Ej: Caramelo Tipo A"
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
                        <button type="submit" className="btn btn-secondary" disabled={isSaving}>
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
                                <th>Peso (Kg)</th>
                                <th>Tolerancia (%)</th>
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
                                        <td>{ing.peso}</td>
                                        <td>{ing.tolerancia}%</td>
                                        <td className="table-actions">
                                            <button className="btn-icon btn-icon-edit" disabled={isSaving}>
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
                        <PictureAsPdf /> Descargar PDF {/* <-- ÍCONO Y TEXTO CAMBIADOS */}
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
            {/* Es importante que este div exista en el DOM para que html2pdf lo pueda "leer" */}
            <div className="pdf-hidden-container"> {/* Clase para ocultar */}
                <ReporteFormula
                    ref={reportePdfRef}
                    formula={formulaData}
                    ingredientes={ingredientes}
                    empresa={empresaInfo}
                />
            </div>

        </div>
    );
}