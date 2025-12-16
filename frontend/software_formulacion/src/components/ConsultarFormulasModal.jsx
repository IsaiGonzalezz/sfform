// ConsultarFormulasModal.jsx (Versión Corregida)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, X, Loader } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import ReporteFormula from './ReporteFormula';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../context/useAuth';
import './styles/ConsultaFormulas.css'

const API_URL_FORMULAS = '/formulas/';
const API_URL_EMPRESA = '/empresa/'
const BASE_URL = import.meta.env.VITE_BACKEND_URL;


const ConsultarFormulasModal = ({ isOpen, onClose }) => {
    // Iniciamos como array vacío siempre
    const [formulasList, setFormulasList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const { axiosInstance } = useAuth();

    const [empresaInfo, setEmpresaInfo] = useState(null); // Guardar info de la empresa
    const [pdfData, setPdfData] = useState(null); // Datos para el PDF (formula, ingredientes, empresa)
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(null); // ID de la fórmula que se está generando
    const reportePdfRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            cargarFormulas();
            cargarEmpresaInfo();
        }
    }, [isOpen]);

    const cargarFormulas = async () => {
        try {
            const response = await axiosInstance.get(`${API_URL_FORMULAS}`);
            const datos = response.data.results || response.data;

            // Aseguramos que sea un array antes de guardarlo
            if (Array.isArray(datos)) {
                setFormulasList(datos);
            } else {
                console.error("El formato recibido no es una lista:", datos);
                setFormulasList([]); // Evita que explote
            }

        } catch (error) {
            console.error("Error cargando formulas", error);
            setFormulasList([]); // En caso de error, lista vacía
        }
    };

    const cargarEmpresaInfo = async () => {
        try {
            const response = await axiosInstance.get(`${API_URL_EMPRESA}`);
            if (response.data && response.data.length > 0) {
                let empresaDatos = response.data[0];
                // Guardamos el OBJETO ya procesado
                setEmpresaInfo(empresaDatos);

            } else {
                console.warn("No se encontraron datos de la empresa");
            }

        } catch (error) {
            console.error("Error cargando info de la empresa", error);
        }
    };

    const handleGenerarPdf = async (formula) => {

        if (isGeneratingPdf === formula.idform) return; // Ya se está generando
        setIsGeneratingPdf(formula.idform);

        try {
            const response = await axiosInstance.get(`${API_URL_FORMULAS}${formula.idform}/`);
            const formulaData = response.data;
            const ingredientesOriginales = formulaData.detalles || [];
            const ingredientesTransformados = ingredientesOriginales.map(ing => ({
                id: ing.iding,
                nombre: ing.nombre_ingrediente, // Convertimos 'nombre_ingrediente' a 'nombre'
                peso: ing.cantidad,           // Convertimos 'cantidad' a 'peso'
                tolerancia: ing.tolerancia    // 'tolerancia' se queda igual
            }));

            // 3. Guardamos todos los datos necesarios en el state 'pdfData'
            const empresaPdf = empresaInfo;
            setPdfData({
                // Transformamos también el objeto 'formula' principal
                formula: {
                    id: formulaData.idform,
                    nombre: formulaData.nombre
                },
                ingredientes: ingredientesTransformados,
                empresa: empresaPdf
            });

            // ¡NO llamamos a html2pdf aquí! Dejamos que el useEffect se encargue.

        } catch (error) {
            console.error("Error preparando los datos del PDF", error);
            alert("Error: No se pudieron cargar los detalles para el PDF.");
            setIsGeneratingPdf(null); // Resetear en caso de error
        }
    };

    useEffect(() => {
        if (pdfData && reportePdfRef.current) {
            // ¡Esta es tu lógica original!
            const element = reportePdfRef.current;
            const pdfFileName = `Formula-${pdfData.formula.id || 'sin-id'}-${pdfData.formula.nombre || 'reporte'}.pdf`;

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

            // Inicia la descarga
            html2pdf().from(element).set(opt).save().then(() => {
                // Limpieza: Reseteamos los states cuando termina
                setPdfData(null);
                setIsGeneratingPdf(null);
            }).catch(err => {
                // Manejar error en la generación
                console.error("Error al guardar PDF", err);
                setPdfData(null);
                setIsGeneratingPdf(null);
            });
        }
    }, [pdfData]);

    // Filtrado SEGURO
    // Añadimos 'Array.isArray(formulasList) && ...' para proteger el filter
    const filteredFormulas = Array.isArray(formulasList)
        ? formulasList.filter((formula) =>
            formula.nombre && formula.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content-large">
                {/* Se renderiza solo cuando 'pdfData' tiene información */}
                {pdfData && (
                    <div className="pdf-hidden-container">
                        <ReporteFormula
                            ref={reportePdfRef}
                            formula={pdfData.formula}
                            ingredientes={pdfData.ingredientes}
                            empresa={pdfData.empresa}
                        />
                    </div>
                )}
                <div className="modal-header">
                    <h2>Consulta General de Fórmulas</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X />
                    </button>
                </div>

                <div className="search-bar-container">
                    <div className="input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar fórmula por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="table-container-scroll">
                    <table className="formulas-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>ID</th>
                                <th style={{ width: '60%' }}>Nombre</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>PDF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Si no hay datos, mostramos un mensaje amigable */}
                            {filteredFormulas.length > 0 ? (
                                filteredFormulas.map((f) => (
                                    <tr key={f.idform}>
                                        <td>{f.idform}</td>
                                        <td>{f.nombre}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="actions-container">
                                                <button
                                                    className="btn-pdf"
                                                    onClick={() => handleGenerarPdf(f)}
                                                    disabled={isGeneratingPdf === f.idform} // Deshabilita solo este botón
                                                >
                                                    {isGeneratingPdf === f.idform ? (
                                                        <Loader size={16} className="spinning-loader" />
                                                    ) : (
                                                        <FileText size={16} />
                                                    )}
                                                </button>
                                                <button className="btn-details" onClick={() => {
                                                    navigate(`/detalle-formula/${f.idform}`);
                                                }}>
                                                    <VisibilityIcon size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                                        {formulasList.length === 0
                                            ? "No se encontraron fórmulas cargadas."
                                            : "No hay coincidencias con la búsqueda."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConsultarFormulasModal;