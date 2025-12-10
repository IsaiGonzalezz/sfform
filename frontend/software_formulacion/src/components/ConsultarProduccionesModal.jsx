import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, X, Loader } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/useAuth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReporteProduccion from './ReporteProduccion';
import './styles/ConsultaProduccion.css'

const API_URL_PRODUCCION_REL = '/produccion/';
const API_URL_EMPRESA_REL = '/empresa/';

// Helper para convertir imágenes a base64 (para que salgan en el PDF)
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

    // Estados para PDF
    const [pdfData, setPdfData] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(null); // Guardará el ID de la OP que se está procesando

    const reportePdfRef = useRef(null);

    // Cargar datos iniciales
    useEffect(() => {
        if (isOpen && axiosInstance) {
            cargarProducciones();
            cargarEmpresaInfo();
        }
    }, [isOpen, axiosInstance]);

    // --- 1. LÓGICA DE AGRUPACIÓN (MODIFICADA) ---
    const cargarProducciones = async () => {
        try {
            const response = await axiosInstance.get(API_URL_PRODUCCION_REL);
            const datosCrudos = response.data.results || response.data;

            if (Array.isArray(datosCrudos)) {
                const agrupadosMap = {};

                datosCrudos.forEach(item => {
                    // Usamos la OP como clave agrupadora
                    const opKey = item.op;

                    if (!agrupadosMap[opKey]) {
                        // Si es la primera vez que vemos esta OP, inicializamos
                        agrupadosMap[opKey] = {
                            ...item, // Heredamos datos generales (fecha, estatus, cliente...)
                            formulasContenidas: []
                        };
                    }

                    // *** CAMBIO CLAVE ***: Guardamos el 'folio' único de este registro específico
                    agrupadosMap[opKey].formulasContenidas.push({
                        folioReal: item.folio || item.id, // EL ID ÚNICO DEL REGISTRO
                        nombre: item.nombre_formula,
                        peso: item.pesform
                    });
                });

                // Convertir mapa a array y ordenar por fecha descendente
                const listaAgrupada = Object.values(agrupadosMap);
                const ordenados = listaAgrupada.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

                setProduccionList(ordenados);
            } else {
                setProduccionList([]);
            }
        } catch (error) {
            console.error("Error cargando producciones:", error);
            setProduccionList([]);
        }
    };

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

    // --- 2. LÓGICA DE GENERACIÓN PDF (RECOLECCIÓN Y FUSIÓN) ---
    const handleGenerarPdf = async (produccionAgrupada) => {
        // Usamos la OP como identificador de carga (para el spinner)
        const idCarga = produccionAgrupada.op;

        if (isGeneratingPdf === idCarga) return;
        setIsGeneratingPdf(idCarga);

        try {
            // A. Identificar todos los folios individuales que pertenecen a esta OP
            const listaFolios = produccionAgrupada.formulasContenidas.map(f => f.folioReal);

            // B. Lanzar todas las peticiones en paralelo (Promise.all)
            const promesas = listaFolios.map(folioId =>
                axiosInstance.get(`${API_URL_PRODUCCION_REL}${folioId}/`)
            );

            const respuestas = await Promise.all(promesas);

            // C. Procesar y fusionar los datos
            let listaIngredientesUnificada = [];
            let pesoTotalAcumulado = 0;

            respuestas.forEach((res) => {
                const data = res.data;
                const detalles = data.detalles || [];
                const pesoFormula = parseFloat(data.pesform || 0);

                // 1. Sumar al total global
                pesoTotalAcumulado += pesoFormula;

                // 2. Agregar SEPARADOR visual (título de la fórmula)
                // Tu componente ReporteProduccion renderiza una fila especial si id es '---'
                listaIngredientesUnificada.push({
                    id: '---',
                    nombre: `--- FÓRMULA: ${data.nombre_formula} (${parseFloat(data.pesform).toFixed(2)}kg) ---`
                });

                // 3. Mapear y agregar los ingredientes de esta fórmula
                detalles.forEach(det => {
                    listaIngredientesUnificada.push({
                        id: det.iding,
                        nombre: det.nombre_ingrediente || `Ingrediente ${det.iding}`,
                        peso: det.pesing,
                        tolerancia: det.tolerancia,
                        pmax: det.pmax,
                        pmin: det.pmin
                    });
                });
            });

            // D. Preparar datos extra (Cabecera Global)
            // Tomamos datos comunes de la OP agrupada
            const datosExtra = {
                op: produccionAgrupada.op,
                lote: produccionAgrupada.lote,
                fecha: produccionAgrupada.fecha,
                estatus: produccionAgrupada.estatus,
                pesoObjetivo: pesoTotalAcumulado, // ENVIAMOS LA SUMA TOTAL
                uuid: produccionAgrupada.uuid || null
            };

            setPdfData({
                ingredientes: listaIngredientesUnificada,
                empresa: empresaInfo,
                extraData: datosExtra
            });

        } catch (error) {
            console.error("Error generando PDF multi-folio", error);
            alert("Error al recopilar los datos de las fórmulas.");
            setIsGeneratingPdf(null);
        }
    };

    // --- EFECTO: DESCARGAR PDF CUANDO pdfData ESTÁ LISTO ---
    useEffect(() => {
        if (pdfData && reportePdfRef.current) {
            const element = reportePdfRef.current;
            const { op } = pdfData.extraData;
            const pdfFileName = `Produccion-${op}.pdf`;

            const opt = {
                margin: 10,
                filename: pdfFileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
            };

            setTimeout(() => {
                html2pdf().from(element).set(opt).save()
                    .then(() => {
                        setPdfData(null);
                        setIsGeneratingPdf(null);
                    })
                    .catch(err => {
                        console.error("Error librería PDF", err);
                        setPdfData(null);
                        setIsGeneratingPdf(null);
                    });
            }, 100);
        }
    }, [pdfData]);

    // Filtros
    const filteredProduccion = Array.isArray(produccionList)
        ? produccionList.filter((p) => {
            const term = searchTerm.toLowerCase();
            const opMatch = p.op && String(p.op).toLowerCase().includes(term);
            const loteMatch = p.lote && String(p.lote).toLowerCase().includes(term);
            const formulaMatch = p.formulasContenidas?.some(f =>
                String(f.nombre).toLowerCase().includes(term)
            );
            return opMatch || loteMatch || formulaMatch;
        })
        : [];

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
                            ingredientes={pdfData.ingredientes}
                            empresa={pdfData.empresa}
                            extraData={pdfData.extraData}
                        />
                    </div>
                )}

                <div className="modal-header">
                    <h2>Consulta de Órdenes de Producción</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X />
                    </button>
                </div>

                <div className="search-bar-container">
                    <div className="input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por OP, Lote o Fórmula..."
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
                                <th style={{ width: '15%' }}>OP</th>
                                <th style={{ width: '15%' }}>Lote</th>
                                <th style={{ width: '30%' }}>Fórmulas Contenidas</th>
                                <th style={{ width: '20%' }}>Fecha</th>
                                <th style={{ width: '10%' }}>Estatus</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProduccion.length > 0 ? (
                                filteredProduccion.map((p) => (
                                    <tr key={p.op || Math.random()}>
                                        <td style={{ fontWeight: 'bold' }}>{p.op}</td>
                                        <td>{p.lote}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {p.formulasContenidas && p.formulasContenidas.length > 0 ? (
                                                    p.formulasContenidas.map((f, idx) => (
                                                        <span key={idx} style={{
                                                            fontSize: '0.85em',
                                                            backgroundColor: 'var(--bg-color)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--border-color)',
                                                            color: 'var(--text-color)'
                                                        }}>
                                                            {f.nombre}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span>{p.nombre_formula}</span>
                                                )}
                                            </div>
                                        </td>
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
                                                    disabled={isGeneratingPdf === p.op}
                                                    title="Descargar Reporte Completo (OP)"
                                                >
                                                    {isGeneratingPdf === p.op ? (
                                                        <Loader size={16} className="spinning-loader" />
                                                    ) : (
                                                        <FileText size={16} />
                                                    )}
                                                </button>

                                                <button
                                                    className="btn-details"
                                                    onClick={() => {
                                                        // Obtenemos el primero para usarlo como "puerta de entrada"
                                                        const folioEntrada = p.formulasContenidas?.[0]?.folioReal || p.folio || p.id;

                                                        // NAVEGAMOS AL PRIMERO
                                                        navigate(`/detalle-produccion/${folioEntrada}`);
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
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
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