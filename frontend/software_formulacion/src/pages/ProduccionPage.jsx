import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import html2pdf from 'html2pdf.js';
import ConsultarProduccionModal from '../components/ConsultarProduccionesModal';
import ReporteProduccion from '../components/ReporteProduccion';
import './styles/Produccion.css';

// --- ICONOS DE MATERIAL UI ---
import {
    Assignment, LibraryAdd, PlaylistAddCheck,
    Save, Add, Edit, ClearAll, PictureAsPdf,
    Visibility, Delete, Close, Print, Inventory2,
    Science
} from '@mui/icons-material';
// --- ICONOS LUCIDE (Para Toasts) ---
import { Check, AlertCircle } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';

// --- NUEVOS IMPORTS PARA EL SELECT MEJORADO (AUTOCOMPLETE) ---
import { Autocomplete, TextField } from '@mui/material';

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
    const [pdfData, setPdfData] = useState(null);

    // --- ESTADO NOTIFICACIÓN TOAST ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- ESTADO MODAL CONFIRMACIÓN IOS ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // --- HELPER TOAST ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // --- 1. CARGA INICIAL (Fórmulas + Empresa) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!axiosInstance) return;
            setIsLoading(true);
            try {
                const [formulasRes, empresaRes] = await Promise.all([
                    axiosInstance.get(API_URL_FORMULAS_REL),
                    axiosInstance.get(API_URL_EMPRESA_REL)
                ]);

                // ORDENAR ALFABÉTICAMENTE LAS FÓRMULAS
                const formulasOrdenadas = formulasRes.data.sort((a, b) => 
                    a.nombre.localeCompare(b.nombre)
                );
                setListaFormulasBase(formulasOrdenadas);

                if (empresaRes.data && empresaRes.data.length > 0) {
                    let empresaDatos = empresaRes.data[0];
                    setEmpresaInfo(empresaDatos);
                }
            } catch (err) {
                console.error("Error cargando datos iniciales:", err);
                showToast('Error al cargar datos del servidor', 'error');
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
            showToast('Completa la Orden y el Lote', 'error');
        }
    };

    // --- NUEVO: MANEJADOR DEL SELECT MEJORADO (Autocomplete) ---
    const handleFormulaSelect = (event, newValue) => {
        if (!newValue) {
            setFormulaSeleccionadaId('');
            return;
        }

        // VALIDACIÓN DE DUPLICADOS: Verificar si la fórmula ya está agregada en este lote
        // Nota: A veces es válido agregar la misma fórmula dos veces (ej. dos baches iguales),
        // pero si tu lógica de negocio lo prohíbe, aquí está la validación:
        const yaExiste = formulasAgregadas.some(f => String(f.idform) === String(newValue.idform));

        if (yaExiste) {
            showToast(`La fórmula "${newValue.nombre}" ya está agregada a esta orden.`, 'error');
            return;
        }

        setFormulaSeleccionadaId(newValue.idform);
    };

    // --- LÓGICA DE ESCALADO Y CÁLCULO (AÑADIR FÓRMULA) ---
    const handleAddFormula = async (e) => {
        e.preventDefault();
        const pesoObjNum = parseFloat(pesoObjetivo);

        if (!formulaSeleccionadaId || !pesoObjetivo || pesoObjNum <= 0) {
            showToast('Selecciona fórmula y peso válido', 'error');
            return;
        }

        try {
            const res = await axiosInstance.get(`${API_URL_FORMULAS_REL}${formulaSeleccionadaId}/`);
            const formulaBackend = res.data;
            const listaDetalles = formulaBackend.detalles || formulaBackend.ingredientes;

            if (!listaDetalles || listaDetalles.length === 0) {
                showToast("La fórmula no tiene ingredientes", 'error');
                return;
            }

            const pesoTotalBase = listaDetalles.reduce((acc, det) => acc + parseFloat(det.cantidad), 0);

            if (pesoTotalBase === 0) {
                showToast("La fórmula base suma 0 Kg", 'error');
                return;
            }

            const factor = pesoObjNum / pesoTotalBase;

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
            
            // Limpiamos selección para permitir agregar otra
            setFormulaSeleccionadaId('');
            setPesoObjetivo('');

        } catch (error) {
            console.error("Error al obtener detalles:", error);
            showToast("Error al obtener detalles de la fórmula", 'error');
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

    // --- SOLICITAR REGISTRO (ABRIR MODAL IOS) ---
    const handleRequestRegistration = () => {
        setShowConfirmModal(true);
    };

    // --- EJECUTAR REGISTRO (AL CONFIRMAR EN EL MODAL) ---
    const executeRegistration = async () => {
        setShowConfirmModal(false);
        setIsSaving(true);

        try {
            const fechaLocal = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();

            const promesasDeGuardado = formulasAgregadas.map(formulaItem => {
                const payload = {
                    op: produccionData.orden,
                    lote: produccionData.lote,
                    idform: formulaItem.idform,
                    pesform: formulaItem.pesform,
                    estatus: 1,
                    fecha: fechaLocal,
                    idusu: user ? user.user_id : 1,
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

            showToast('¡Producción registrada exitosamente!');
            handleLimpiarFormulario();

        } catch (error) {
            console.error("Error guardando producción:", error);
            const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            showToast(`Error al guardar: ${msg}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // --- GENERAR PDF ---
    const handlePreparePdf = () => {
        const todosLosIngredientes = [];
        formulasAgregadas.forEach(f => {
            todosLosIngredientes.push({
                id: '---',
                nombre: `--- FÓRMULA: ${f.nombre} (${f.pesform} Kg) ---`,
                peso: '',
                pmax: '',
                pmin: ''
            });
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

        setTimeout(() => {
            if (reportePdfRef.current) {
                const element = reportePdfRef.current;
                const pdfFileName = `Produccion-${produccionData.orden}.pdf`;
                const opt = {
                    margin: 10,
                    filename: pdfFileName,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
                };
                html2pdf().from(element).set(opt).save();
                setPdfData(null);
            }
        }, 500);
    };

    const handleOpenModal = (formula) => {
        setCurrentModalData(formula);
        setModalOpen(true);
    };

    return (
        <div className="produccion-page" style={{ position: 'relative' }}>

            {/* --- TOAST NOTIFICATION --- */}
            {toast.show && (
                <div style={{
                    ...customStyles.toast,
                    backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: toast.type === 'error' ? '#991b1b' : '#15803d',
                    borderColor: toast.type === 'error' ? '#fecaca' : '#bbf7d0',
                }}>
                    <div style={{
                        ...customStyles.toastIconContainer,
                        backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e',
                    }}>
                        {toast.type === 'error' ? <AlertCircle size={16} color="#fff" /> : <Check size={16} color="#fff" strokeWidth={3} />}
                    </div>
                    {toast.message}
                </div>
            )}

            {/* --- MODAL CONFIRMACIÓN ESTILO IOS --- */}
            {showConfirmModal && (
                <div style={customStyles.modalOverlay}>
                    <div style={customStyles.iosModal}>
                        <div style={customStyles.iosModalContent}>
                            <h3 style={customStyles.iosTitle}>Confirmar Registro</h3>
                            <p style={customStyles.iosMessage}>
                                ¿Estás seguro de registrar la producción <strong>{produccionData.orden}</strong> con Lote <strong>{produccionData.lote}</strong>?
                            </p>
                        </div>
                        <div style={customStyles.iosActionGroup}>
                            <button
                                style={customStyles.iosButtonCancel}
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                style={customStyles.iosButtonConfirm}
                                onClick={executeRegistration}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="action-bar">
                <button className="btn btn-secondary" onClick={handleLimpiarFormulario} disabled={isSaving}>
                    <ClearAll /> Limpiar Formulario
                </button>
                <button className="btn btn-edit" onClick={() => setShowConsultar(true)} disabled={isSaving}>
                    <Edit /> Consultar Producciones
                </button>
            </div>

            {/* PASO 1 */}
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

            {/* PASO 2 */}
            <div className={`produccion-card-step ${!paso1Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><LibraryAdd /> Paso 2: Agregar Fórmulas al Lote</h2>
                <form onSubmit={handleAddFormula} className="form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="nombreFormula">Fórmula Base</label>
                        
                        {/* 1. AUTOCOMPLETE MEJORADO */}
                        <Autocomplete
                            id="nombreFormula"
                            options={listaFormulasBase}
                            getOptionLabel={(option) => option.nombre || ''}
                            // Encontramos el objeto seleccionado
                            value={listaFormulasBase.find(f => String(f.idform) === String(formulaSeleccionadaId)) || null}
                            onChange={handleFormulaSelect}
                            disabled={!paso1Completo || isLoading}
                            noOptionsText="No se encontró la fórmula"
                            // Importante para comparar objetos
                            isOptionEqualToValue={(option, value) => String(option.idform) === String(value.idform)}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    placeholder={isLoading ? "Cargando..." : "Buscar fórmula..."}
                                    variant="outlined"
                                    size="small"
                                    // Estilo Dark personalizado para igualar tus inputs
                                    sx={{
                                        backgroundColor: 'var(--bg-color)',
                                        '& .MuiOutlinedInput-root': {
                                            color: 'var(--text-color)', 
                                            borderRadius: '8px',
                                            '& fieldset': { borderColor: '#444' }, 
                                            '&:hover fieldset': { borderColor: '#666' }, 
                                            '&.Mui-focused fieldset': { borderColor: '#1B519DFF' }, 
                                        },
                                        '& .MuiInputLabel-root': { color: '#888' },
                                        '& .MuiSvgIcon-root': { color: '#888' }
                                    }}
                                />
                            )}
                        />
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
                                                <Visibility style={{ backgroundColor: '#1B519DFF', borderRadius: '8px', padding: '6px', color: '#FFFFFF', fontSize: '32px' }} />
                                            </button>
                                            <button className="icon-btn action-delete" onClick={() => handleRemoveFormula(formula.tempId)}>
                                                <Delete style={{ backgroundColor: '#9D1B1BFF', borderRadius: '8px', padding: '6px', color: '#FFFFFF', fontSize: '32px' }} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PASO 3 */}
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
                    <button className="btn btn-primary" onClick={handleRequestRegistration} disabled={!paso2Completo || isSaving}>
                        {isSaving ? <CircularProgress size={20} color="inherit" /> : <Inventory2 fontSize="small" />}
                        {isSaving ? ' Guardando...' : ' Registrar Producción'}
                    </button>
                </div>
            </div>

            {/* --- MODAL DETALLE --- */}
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
                            <p style={{ backgroundColor: '#F5F5F5', borderRadius: '4px', padding: '2px', textAlign: 'center', color: '#333', fontSize: '0.75rem' }}>
                                Datos calculados según tolerancia definida.
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

            {/* --- MODAL CONSULTAR --- */}
            <ConsultarProduccionModal
                isOpen={showConsultar}
                onClose={() => setShowConsultar(false)}
            />

            {/* --- PDF OCULTO --- */}
            {pdfData && (
                <div className="pdf-hidden-container">
                    <ReporteProduccion
                        ref={reportePdfRef}
                        empresa={pdfData.empresa}
                        ingredientes={pdfData.ingredientes}
                        extraData={{
                            op: produccionData.orden || 'ERROR',
                            lote: produccionData.lote || 'ERROR',
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

// --- ESTILOS INLINE PARA COMPONENTES PERSONALIZADOS ---
const customStyles = {
    // Toast
    toast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: '600',
        fontSize: '0.95rem',
        zIndex: 9999,
        border: '1px solid',
        animation: 'slideIn 0.3s ease-out'
    },
    toastIconContainer: {
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    // Modal iOS
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out'
    },
    iosModal: {
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-color)',
        width: '85%',
        maxWidth: '320px',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        textAlign: 'center',
        animation: 'scaleUp 0.2s ease-out'
    },
    iosModalContent: {
        padding: '24px 20px 20px 20px',
    },
    iosTitle: {
        margin: '0 0 10px 0',
        fontSize: '1.2rem',
        fontWeight: '700',
    },
    iosMessage: {
        margin: 0,
        fontSize: '0.95rem',
        opacity: 0.8,
        lineHeight: 1.4
    },
    iosActionGroup: {
        display: 'flex',
        borderTop: '1px solid var(--border-color)',
    },
    iosButtonCancel: {
        flex: 1,
        padding: '16px',
        background: 'transparent',
        border: 'none',
        borderRight: '1px solid var(--border-color)',
        color: '#ef4444',
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    iosButtonConfirm: {
        flex: 1,
        padding: '16px',
        background: 'transparent',
        border: 'none',
        color: '#3b82f6',
        fontWeight: '700',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'background 0.2s'
    }
};