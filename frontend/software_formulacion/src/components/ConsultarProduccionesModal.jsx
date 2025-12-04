import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, X, Loader } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/useAuth';
import VisibilityIcon from '@mui/icons-material/Visibility';
// Asegúrate de que este componente exista o usa ReporteFormula si es genérico
import ReporteProduccion from './ReporteFormula'; 
import './styles/ConsultaProduccion.css'


// --- URL RELATIVA ---
const API_URL_PRODUCCION_REL = '/produccion/';
const API_URL_EMPRESA_REL = '/empresa/';

// Función auxiliar para convertir imágenes
const convertToBase64 = async (url) => {
    if (!url) return null;
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

const ConsultarProduccionModal = ({ isOpen, onClose }) => {
    const { axiosInstance } = useAuth();
    const navigate = useNavigate();

    // Estados
    const [produccionList, setProduccionList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [empresaInfo, setEmpresaInfo] = useState(null);
    const [pdfData, setPdfData] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(null);
    
    const reportePdfRef = useRef(null);

    // Cargar datos al abrir el modal
    useEffect(() => {
        if (isOpen && axiosInstance) {
            cargarProducciones();
            cargarEmpresaInfo();
        }
    }, [isOpen, axiosInstance]);

    // --- CARGAR LISTA DE PRODUCCIONES ---
    const cargarProducciones = async () => {
        try {
            const response = await axiosInstance.get(API_URL_PRODUCCION_REL);
            // Manejo robusto de la respuesta para evitar errores de tipo 'never'
            const datos = response.data.results || response.data;

            if (Array.isArray(datos)) {
                // Ordenamos por fecha descendente
                const ordenados = [...datos].sort((a, b) => {
                    return new Date(b.fecha || 0) - new Date(a.fecha || 0);
                });
                setProduccionList(ordenados);
            } else {
                setProduccionList([]);
            }

        } catch (error) {
            console.error("Error cargando producciones:", error);
            setProduccionList([]);
        }
    };

    // --- CARGAR INFO EMPRESA ---
    const cargarEmpresaInfo = async () => {
        try {
            const response = await axiosInstance.get(API_URL_EMPRESA_REL);
            if (response.data && response.data.length > 0) {
                let empresaDatos = response.data[0];
                if (empresaDatos.logotipo) {
                    const base64Logo = await convertToBase64(empresaDatos.logotipo);
                    if (base64Logo) empresaDatos.logotipo = base64Logo;
                }
                setEmpresaInfo(empresaDatos);
            }
        } catch (error) {
            console.error("Error cargando empresa:", error);
        }
    };

    // --- GENERAR PDF ---
    const handleGenerarPdf = async (produccion) => {
        const idUnico = produccion.folio || produccion.id; 

        if (isGeneratingPdf === idUnico) return;
        setIsGeneratingPdf(idUnico);

        try {
            const response = await axiosInstance.get(`${API_URL_PRODUCCION_REL}${idUnico}/`);
            const produccionData = response.data;
            
            const detallesTransformados = (produccionData.detalles || []).map(det => ({
                id: det.iding,
                nombre: det.nombre_ingrediente || `Ingrediente ${det.iding}`,
                peso: det.pesing,
                pmax: det.pmax,
                pmin: det.pmin,
                pesado: det.pesado
            }));

            setPdfData({
                cabecera: {
                    op: produccionData.op,
                    lote: produccionData.lote,
                    fecha: produccionData.fecha,
                    pesoObjetivo: produccionData.pesform,
                    estatus: produccionData.estatus
                },
                detalles: detallesTransformados,
                empresa: empresaInfo
            });

        } catch (error) {
            console.error("Error obteniendo detalles para PDF", error);
            alert("No se pudieron cargar los detalles para el PDF.");
            setIsGeneratingPdf(null);
        }
    };

    // --- EFECTO: DESCARGAR PDF ---
    useEffect(() => {
        if (pdfData && reportePdfRef.current) {
            const element = reportePdfRef.current;
            const { op, lote } = pdfData.cabecera;
            const pdfFileName = `Produccion-OP-${op}-Lote-${lote}.pdf`;

            const opt = {
                margin: 10,
                filename: pdfFileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(element).set(opt).save()
                .then(() => {
                    setPdfData(null);
                    setIsGeneratingPdf(null);
                })
                .catch(err => {
                    console.error("Error generando PDF", err);
                    setPdfData(null);
                    setIsGeneratingPdf(null);
                });
        }
    }, [pdfData]);

    // --- FILTRADO ---
    const filteredProduccion = Array.isArray(produccionList)
        ? produccionList.filter((p) => {
            const term = searchTerm.toLowerCase();
            const opMatch = p.op && String(p.op).toLowerCase().includes(term);
            const loteMatch = p.lote && String(p.lote).toLowerCase().includes(term);
            return opMatch || loteMatch;
        })
        : [];

    // --- HELPERS ---
    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '-';
        return new Date(fechaISO).toLocaleDateString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content-large">
                
                {/* PDF OCULTO */}
                {pdfData && (
                    <div className="pdf-hidden-container">
                        <ReporteProduccion
                            ref={reportePdfRef}
                            formula={{ nombre: `OP: ${pdfData.cabecera.op} - Lote: ${pdfData.cabecera.lote}` }} 
                            ingredientes={pdfData.detalles}
                            empresa={pdfData.empresa}
                            extraData={pdfData.cabecera} 
                        />
                    </div>
                )}

                <div className="modal-header">
                    <h2>Consulta de Órdenes de Producción</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X />
                    </button>
                </div>

                {/* Buscador */}
                <div className="search-bar-container">
                    <div className="input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por OP o Lote..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="table-container-scroll">
                    <table className="formulas-table">
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>OP</th>
                                <th style={{ width: '15%' }}>Lote</th>
                                <th style={{ width: '15%' }}>ID</th>
                                <th style={{ width: '25%' }}>Formula</th>
                                <th style={{ width: '25%' }}>Fecha</th>
                                <th style={{ width: '15%' }}>Estatus</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProduccion.length > 0 ? (
                                filteredProduccion.map((p) => (
                                    /* CORRECCIÓN: Eliminado comentario dentro del tr y asegurado key único */
                                    <tr key={p.folio || p.op || Math.random()}>
                                        <td>{p.op}</td>
                                        <td>{p.lote}</td>
                                        <td>{p.idform}</td>
                                        <td>{p.nombre_formula}</td>
                                        <td>{formatearFecha(p.fecha)}</td>
                                        <td>
                                            <span className={`status-badge ${p.estatus === 1 ? 'active' : 'inactive'}`}>
                                                {p.estatus === 1 ? 'Activa' : 'Cerrada'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="actions-container">
                                                <button
                                                    className="btn-pdf"
                                                    onClick={() => handleGenerarPdf(p)}
                                                    disabled={isGeneratingPdf === (p.folio || p.id)}
                                                    title="Descargar Reporte PDF"
                                                >
                                                    {isGeneratingPdf === (p.folio || p.id) ? (
                                                        <Loader size={16} className="spinning-loader" />
                                                    ) : (
                                                        <FileText size={16} />
                                                    )}
                                                </button>
                                                <button 
                                                    className="btn-details" 
                                                    onClick={() => {
                                                        navigate(`/detalle-produccion/${p.folio}`);
                                                        onClose();
                                                    }}
                                                    title="Ver Detalle"
                                                >
                                                    <VisibilityIcon size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        {produccionList.length === 0
                                            ? "No hay producciones registradas."
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

export default ConsultarProduccionModal;