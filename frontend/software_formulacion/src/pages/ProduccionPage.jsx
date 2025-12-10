import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import html2pdf from 'html2pdf.js';
import ConsultarProduccionModal from '../components/ConsultarProduccionesModal';
import ReporteProduccion from '../components/ReporteProduccion';
import './styles/Produccion.css';
import '../components/styles/Reporte.css';

// --- ICONOS DE MATERIAL UI ---
import {
    Assignment, LibraryAdd, PlaylistAddCheck,
    Save, Add, Edit, ClearAll, PictureAsPdf,
    Visibility, Delete, Close, Print, Inventory2,
    Science
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';

// --- URLs RELATIVAS ---
const API_URL_FORMULAS_REL = '/formulas/';
const API_URL_PRODUCCION_REL = '/produccion/';
const API_URL_EMPRESA_REL = '/empresa/';

export default function ProduccionPage() {
    const { axiosInstance, user } = useAuth();
    const reportePdfRef = useRef(null);

    // --- ESTADOS PRINCIPALES ---
    const [paso1Completo, setPaso1Completo] = useState(false);

    // Datos de Cabecera (Paso 1)
    const [produccionData, setProduccionData] = useState({
        orden: '',
        lote: ''
    });

    // Datos de Selección (Paso 2)
    const [formulaSeleccionadaId, setFormulaSeleccionadaId] = useState('');
    const [pesoObjetivo, setPesoObjetivo] = useState('');

    // Lista de fórmulas agregadas a la producción (Tabla)
    const [formulasAgregadas, setFormulasAgregadas] = useState([]);

    // --- ESTADOS DE CARGA Y DATOS EXTERNOS ---
    const [listaFormulasBase, setListaFormulasBase] = useState([]);
    const [empresaInfo, setEmpresaInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showConsultar, setShowConsultar] = useState(false);

    // Estados para Modals y PDF
    const [modalOpen, setModalOpen] = useState(false);
    const [currentModalData, setCurrentModalData] = useState(null);
    const [pdfData, setPdfData] = useState(null); // Data específica para generar el PDF

    // --- HELPER: Convertir Imagen a Base64 (Vital para el PDF) ---
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

    // --- 1. CARGA INICIAL (Fórmulas + Empresa) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!axiosInstance) return;
            setIsLoading(true);
            try {
                // Usamos Promise.all para cargar todo junto
                const [formulasRes, empresaRes] = await Promise.all([
                    axiosInstance.get(API_URL_FORMULAS_REL),
                    axiosInstance.get(API_URL_EMPRESA_REL)
                ]);

                setListaFormulasBase(formulasRes.data);

                // Procesar logo de empresa
                if (empresaRes.data && empresaRes.data.length > 0) {
                    let empresaDatos = empresaRes.data[0];
                    if (empresaDatos.logotipo) {
                        const base64Logo = await convertToBase64(empresaDatos.logotipo);
                        if (base64Logo) empresaDatos.logotipo = base64Logo;
                    }
                    setEmpresaInfo(empresaDatos);
                }
            } catch (err) {
                console.error("Error cargando datos iniciales:", err);
                alert('No se pudieron cargar los datos del servidor.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [axiosInstance]);

    // --- CÁLCULOS DERIVADOS ---
    const { pesoTotal, totalFormulas } = useMemo(() => {
        const peso = formulasAgregadas.reduce((acc, f) => acc + parseFloat(f.pesform || 0), 0);
        return {
            pesoTotal: peso.toFixed(2),
            totalFormulas: formulasAgregadas.length
        };
    }, [formulasAgregadas]);

    const paso2Completo = formulasAgregadas.length > 0;

    // --- FORMATO DE NÚMEROS ---
    const formatearValor = (valor) => {
        const numero = parseFloat(valor);
        if (isNaN(numero)) return '0.00';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numero);
    };

    // --- MANEJADORES DE EVENTOS (INPUTS) ---
    const handlePaso1Change = (e) => {
        const { name, value } = e.target;
        setProduccionData(prev => ({ ...prev, [name]: value }));
    };

    const handleDefinirProduccion = (e) => {
        e.preventDefault();
        if (produccionData.orden && produccionData.lote) {
            setPaso1Completo(true);
        } else {
            alert('Por favor, completa la Orden de Producción y el Lote.');
        }
    };

    // --- LÓGICA DE ESCALADO Y CÁLCULO (AÑADIR FÓRMULA) ---
    const handleAddFormula = async (e) => {
        e.preventDefault();
        const pesoObjNum = parseFloat(pesoObjetivo);

        if (!formulaSeleccionadaId || !pesoObjetivo || pesoObjNum <= 0) {
            alert('Selecciona una fórmula E ingresa un Peso Objetivo válido.');
            return;
        }

        try {
            // Traemos los detalles frescos del backend
            const res = await axiosInstance.get(`${API_URL_FORMULAS_REL}${formulaSeleccionadaId}/`);
            const formulaBackend = res.data;

            // 'ingredientes' para escritura o 'detalles' para lectura según tu API
            const listaDetalles = formulaBackend.detalles || formulaBackend.ingredientes;

            if (!listaDetalles || listaDetalles.length === 0) {
                alert("Error: La fórmula seleccionada no tiene ingredientes cargados.");
                return;
            }

            // Suma del peso base original
            const pesoTotalBase = listaDetalles.reduce((acc, det) => acc + parseFloat(det.cantidad), 0);

            if (pesoTotalBase === 0) {
                alert("Error: La fórmula base suma 0 Kg.");
                return;
            }

            // Factor de escalado
            const factor = pesoObjNum / pesoTotalBase;

            // Calcular nuevos pesos
            const ingredientesCalculados = listaDetalles.map(det => {
                const pesoBaseIng = parseFloat(det.cantidad);
                const nuevoPeso = pesoBaseIng * factor;

                const toleranciaPorcentaje = parseFloat(det.tolerancia || 0);
                const valorTolerancia = nuevoPeso * (toleranciaPorcentaje / 100);

                return {
                    iding: det.iding,
                    nombre: det.nombre_ingrediente || "Ingrediente",
                    pesing: nuevoPeso.toFixed(3),
                    pmax: (nuevoPeso + valorTolerancia).toFixed(3),
                    pmin: (nuevoPeso - valorTolerancia).toFixed(3),
                    pesado: 0
                };
            });

            const nuevaFormulaProduccion = {
                tempId: Date.now(),
                idform: formulaBackend.idform,
                nombre: formulaBackend.nombre,
                pesform: pesoObjNum,
                ingredientes: ingredientesCalculados
            };

            setFormulasAgregadas([...formulasAgregadas, nuevaFormulaProduccion]);
            setFormulaSeleccionadaId('');
            setPesoObjetivo('');

        } catch (error) {
            console.error("Error al obtener detalles:", error);
            alert("Error de conexión al buscar los detalles de la fórmula.");
        }
    };

    const handleRemoveFormula = (tempId) => {
        setFormulasAgregadas(formulasAgregadas.filter(f => f.tempId !== tempId));
    };

    const handleLimpiarFormulario = () => {
        setPaso1Completo(false);
        setProduccionData({ orden: '', lote: '' });
        setFormulasAgregadas([]);
        setFormulaSeleccionadaId('');
        setPesoObjetivo('');
        setPdfData(null);
    };

    // --- GUARDAR PRODUCCIÓN (POST LOOP) ---
    const handleRegistrarProduccion = async () => {
        if (!window.confirm("¿Estás seguro de registrar esta producción?")) return;

        setIsSaving(true);
        try {
            // Generamos la fecha local una sola vez para todo el lote
            const fechaLocal = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();

            const promesasDeGuardado = formulasAgregadas.map(formulaItem => {
                const payload = {
                    op: produccionData.orden,
                    lote: produccionData.lote,
                    idform: formulaItem.idform,
                    pesform: formulaItem.pesform,
                    estatus: 0,
                    fecha: fechaLocal,
                    idusu: user ? user.user_id : 1,

                    // Lista anidada para DetalleProduccion
                    detalles: formulaItem.ingredientes.map(ing => ({
                        iding: ing.iding,
                        pesing: parseFloat(ing.pesing),
                        pmax: parseFloat(ing.pmax),
                        pmin: parseFloat(ing.pmin),
                        pesado: 0
                    }))
                };
                return axiosInstance.post(API_URL_PRODUCCION_REL, payload);
            });

            await Promise.all(promesasDeGuardado);

            alert('¡Producción registrada exitosamente!');
            handleLimpiarFormulario();

        } catch (error) {
            console.error("Error guardando producción:", error);
            const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Error al guardar: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- GENERAR PDF DEL RESUMEN ---
    const handlePreparePdf = () => {
        // Preparamos un objeto que combine todas las fórmulas para el reporte
        // Nota: ReporteFormula espera 'formula', 'ingredientes', 'empresa'.

        const todosLosIngredientes = [];
        formulasAgregadas.forEach(f => {
            // Agregamos un encabezado falso como ingrediente para separar fórmulas visualmente
            todosLosIngredientes.push({
                id: '---',
                nombre: `--- FÓRMULA: ${f.nombre} (${f.pesform} Kg) ---`,
                peso: '',
                pmax: '',
                pmin: ''
            });
            // Agregamos los ingredientes reales
            f.ingredientes.forEach(ing => {
                todosLosIngredientes.push({
                    id: ing.iding,
                    nombre: ing.nombre,
                    peso: ing.pesing,
                    pmax: ing.pmax,
                    pmin: ing.pmin
                });
            });
        });

        setPdfData({
            formula: { nombre: `OP: ${produccionData.orden} - Lote: ${produccionData.lote}`, id: 'N/A' },
            ingredientes: todosLosIngredientes,
            empresa: empresaInfo
        });


        // Esperamos un tick para que se renderice el componente oculto y luego imprimimos
        setTimeout(() => {
            if (reportePdfRef.current) {
                const element = reportePdfRef.current;
                const pdfFileName = `Produccion-${produccionData.orden}.pdf`;
                const opt = {
                    margin: 10,
                    filename: pdfFileName,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
                };
                html2pdf().from(element).set(opt).save();
                setPdfData(null); // Limpiamos después de guardar
            }
        }, 500);
    };

    // --- MANEJADORES DE MODAL DETALLE ---
    const handleOpenModal = (formula) => {
        setCurrentModalData(formula);
        setModalOpen(true);
    };

    return (
        <div className="produccion-page"> {/* Asegúrate de que el CSS coincida o usa 'formula-page' si comparten estilos */}

            <div className="action-bar">
                <button className="btn btn-secondary" onClick={handleLimpiarFormulario} disabled={isSaving}>
                    <ClearAll /> Limpiar Formulario
                </button>
                <button className="btn btn-edit" onClick={() => setShowConsultar(true)} disabled={isSaving}>
                    <Edit /> Consultar Producciones
                </button>
            </div>

            {/* --- PASO 1: DEFINIR --- */}
            <div className={`produccion-card-step ${paso1Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><Assignment /> Paso 1: Definir Producción</h2>
                <form onSubmit={handleDefinirProduccion} className="form-grid">
                    <div className="form-group">
                        <label htmlFor="orden">Orden Producción</label>
                        <input
                            type="text"
                            id="orden"
                            name="orden"
                            value={produccionData.orden}
                            onChange={handlePaso1Change}
                            disabled={paso1Completo}
                            className="form-input"
                            placeholder="Ej: OP-1001"
                            style={{ width: '100%' }}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lote">Lote</label>
                        <input
                            type="text"
                            id="lote"
                            name="lote"
                            value={produccionData.lote}
                            onChange={handlePaso1Change}
                            disabled={paso1Completo}
                            className="form-input"
                            placeholder="Ej: L-2025-003"
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={paso1Completo} style={{ width: '100%' }}>
                            <Save fontSize="small" /> Continuar
                        </button>
                    </div>
                </form>
            </div>

            {/* --- PASO 2: SELECCIONAR FÓRMULAS --- */}
            <div className={`produccion-card-step ${!paso1Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><LibraryAdd /> Paso 2: Agregar Fórmulas al Lote</h2>

                <form onSubmit={handleAddFormula} className="form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="nombreFormula">Fórmula Base</label>
                        <select
                            id="nombreFormula"
                            className="form-select"
                            value={formulaSeleccionadaId}
                            onChange={(e) => setFormulaSeleccionadaId(e.target.value)}
                            disabled={!paso1Completo || isLoading}
                        >
                            <option value="">{isLoading ? "Cargando..." : "Seleccionar fórmula..."}</option>
                            {listaFormulasBase.map(f => (
                                <option key={f.idform} value={f.idform}>{f.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="pesoObjetivo">Peso Objetivo (Kg)</label>
                        <input
                            type="number"
                            id="pesoObjetivo"
                            name="pesoObjetivo"
                            value={pesoObjetivo}
                            onChange={(e) => setPesoObjetivo(e.target.value)}
                            className="form-input"
                            placeholder="0.00"
                            disabled={!paso1Completo}
                            step="0.01"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-warning" disabled={!paso1Completo} style={{ width: '100%' }}>
                            <Add fontSize="small" /> Añadir
                        </button>
                    </div>
                </form>

                <div className="divider"></div>

                <h3 className="subsection-title">Fórmulas Agregadas</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fórmula</th>
                                <th>Peso Obj. (Kg)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formulasAgregadas.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', color: '#777' }}>
                                        No hay fórmulas en este lote.
                                    </td>
                                </tr>
                            ) : (
                                formulasAgregadas.map((formula) => (
                                    <tr key={formula.tempId}>
                                        <td>{formula.nombre}</td>
                                        <td>{formatearValor(formula.pesform)}</td>
                                        <td className="col-acciones">
                                            <button className="icon-btn action-view" onClick={() => handleOpenModal(formula)}>
                                                <Visibility
                                                    style={{
                                                        backgroundColor: '#1B519DFF',   // fondo
                                                        borderRadius: '8px',          // esquinas redondeadas
                                                        padding: '6px',               // espacio interno alrededor del ícono
                                                        color: '#FFFFFF',                // color del ícono
                                                        fontSize: '32px'              // tamaño del ícono
                                                    }}
                                                />
                                            </button>
                                            <button className="icon-btn action-delete" onClick={() => handleRemoveFormula(formula.tempId)}>
                                                <Delete
                                                    style={{
                                                        backgroundColor: '#9D1B1BFF',   // fondo
                                                        borderRadius: '8px',          // esquinas redondeadas
                                                        padding: '6px',               // espacio interno alrededor del ícono
                                                        color: '#FFFFFF',                // color del ícono
                                                        fontSize: '32px'              // tamaño del ícono
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

            {/* --- PASO 3: CONFIRMAR --- */}
            <div className={`produccion-card-step ${!paso1Completo || !paso2Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><PlaylistAddCheck /> Paso 3: Resumen y Registro</h2>

                <div className="totals-grid">
                    <div className="total-box">
                        <p>Peso Total Lote</p>
                        <div className="total-value"> {formatearValor(pesoTotal)} Kg</div>
                    </div>
                    <div className="total-box">
                        <p>Fórmulas</p>
                        <div className="total-value">{totalFormulas}</div>
                    </div>
                </div>

                <div className="production-final-actions">
                    <button className="btn btn-danger" onClick={handlePreparePdf} disabled={!paso2Completo}>
                        <Print fontSize="small" /> Descargar PDF
                    </button>
                    <button className="btn btn-primary" onClick={handleRegistrarProduccion} disabled={!paso2Completo || isSaving}>
                        {isSaving ? <CircularProgress size={20} color="inherit" /> : <Inventory2 fontSize="small" />}
                        {isSaving ? ' Guardando...' : ' Registrar Producción'}
                    </button>
                </div>
            </div>

            {/* --- MODAL DETALLE DE CÁLCULO --- */}
            {modalOpen && currentModalData && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Detalle Calculado: {currentModalData.nombre}</h4>
                            <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                                <Close />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-subtitle">
                                Lote: <strong>{produccionData.lote}</strong> | Objetivo: <strong> {formatearValor(currentModalData.pesform)} Kg</strong>
                            </p>
                            <p
                                style={{
                                    backgroundColor: '#F5F5F5',
                                    borderRadius: '4px',
                                    padding: '2px',
                                    textAlign: 'center',
                                    color: '#333333',
                                    fontSize: '0.75rem',
                                }}
                            >
                                Los datos mostrados se calculan según el valor objetivo y la tolerancia definidos en la fórmula de cada ingrediente.
                            </p>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Ingrediente</th>
                                            <th style={{ textAlign: 'right' }}>Peso Calc</th>
                                            <th style={{ textAlign: 'right' }}>Mín</th>
                                            <th style={{ textAlign: 'right' }}>Máx</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentModalData.ingredientes.map((ing, idx) => (
                                            <tr key={idx}>
                                                <td>{ing.nombre}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatearValor(ing.pesing)}</td>
                                                <td style={{ textAlign: 'right', color: '#ff6b6b' }}>{formatearValor(ing.pmin)}</td>
                                                <td style={{ textAlign: 'right', color: '#51cf66' }}>{formatearValor(ing.pmax)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CONSULTAR HISTORIAL --- */}
            <ConsultarProduccionModal
                isOpen={showConsultar}
                onClose={() => setShowConsultar(false)}
            />

            {/* --- COMPONENTE OCULTO PARA GENERAR PDF --- */}
            {pdfData && (
                <div className="pdf-hidden-container">
                    <ReporteProduccion
                        ref={reportePdfRef}

                        empresa={pdfData.empresa}
                        ingredientes={pdfData.ingredientes}


                        extraData={{
                            op: produccionData.orden || '001',
                            lote: produccionData.lote || 'L-000',
                            pesoObjetivo: pesoTotal || 0,
                            fecha: new Date(),
                            estatus: 1
                        }}
                    />
                </div>
            )}
        </div>
    );
}