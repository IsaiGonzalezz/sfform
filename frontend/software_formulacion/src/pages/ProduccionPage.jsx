import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/useAuth'; // Importamos el hook de autenticación
import './styles/Produccion.css';

// --- ICONOS ---
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { ClearAll, Edit } from '@mui/icons-material';

// --- URLs RELATIVAS (Ajusta si es necesario) --- 
const API_URL_FORMULAS_REL = `/formulas/`;
const API_URL_PRODUCCION_REL = `/produccion/`

const ProduccionPage = () => {
    const { axiosInstance, user } = useAuth(); // Obtenemos el usuario para mandarlo en el POST

    // --- ESTADOS DE PASOS ---
    const [paso1Completo, setPaso1Completo] = useState(false);

    // --- ESTADOS DE DATOS ---
    const [produccionData, setProduccionData] = useState({
        orden: '',
        lote: ''
    });

    // Estado para guardar las fórmulas traídas de la API (Base de datos)
    const [listaFormulasBase, setListaFormulasBase] = useState([]);
    const [isLoadingFormulas, setIsLoadingFormulas] = useState(false);

    // --- Estados para el formulario del PASO 2 ---
    const [formulaSeleccionadaId, setFormulaSeleccionadaId] = useState('');
    const [pesoObjetivo, setPesoObjetivo] = useState('');

    // Aquí guardaremos las fórmulas YA CALCULADAS listas para producción
    const [formulasAgregadas, setFormulasAgregadas] = useState([]);

    // --- ESTADOS DE UI ---
    const [modalOpen, setModalOpen] = useState(false);
    const [currentModalData, setCurrentModalData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- 1. CARGA INICIAL DE FÓRMULAS ---
    useEffect(() => {
        const fetchFormulas = async () => {
            if (!axiosInstance) return;
            setIsLoadingFormulas(true);
            try {
                const res = await axiosInstance.get(API_URL_FORMULAS_REL);
                setListaFormulasBase(res.data);
            } catch (error) {
                console.error("Error cargando fórmulas:", error);
                alert("Error al cargar el catálogo de fórmulas.");
            } finally {
                setIsLoadingFormulas(false);
            }
        };
        fetchFormulas();
    }, [axiosInstance]);


    // --- CÁLCULOS DERIVADOS (useMemo) ---
    const { pesoTotal, totalFormulas } = useMemo(() => {
        const peso = formulasAgregadas.reduce((acc, f) => acc + parseFloat(f.pesform || 0), 0);
        return {
            pesoTotal: peso.toFixed(2),
            totalFormulas: formulasAgregadas.length
        };
    }, [formulasAgregadas]);

    const paso2Completo = formulasAgregadas.length > 0;

    // --- MANEJADORES DE EVENTOS ---

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

    // --- LÓGICA DE ESCALADO Y CÁLCULO  ---
    const handleAddFormula = async (e) => {
        e.preventDefault();
        const pesoObjNum = parseFloat(pesoObjetivo);

        // 1. Validaciones básicas de UI
        if (!formulaSeleccionadaId || !pesoObjetivo || pesoObjNum <= 0) {
            alert('Selecciona una fórmula E ingresa un Peso Objetivo válido (mayor a 0).');
            return;
        }

        try {
            // 2. PETICIÓN AL BACKEND: Traemos la fórmula específica con sus detalles
            // Usamos el ID seleccionado para obtener el JSON que me acabas de mostrar
            const res = await axiosInstance.get(`${API_URL_FORMULAS_REL}${formulaSeleccionadaId}/`);
            const formulaBackend = res.data;

            console.log("Datos recibidos del backend:", formulaBackend);

            // 3. Validar que existan los detalles (LA CLAVE: se llama 'detalles')
            const listaDetalles = formulaBackend.detalles;

            if (!listaDetalles || listaDetalles.length === 0) {
                alert("Error: La fórmula seleccionada no tiene ingredientes ('detalles') cargados en el sistema.");
                return;
            }

            // 4. Calcular el peso total original de la fórmula base
            // OJO: En tu JSON el peso viene como 'cantidad'
            const pesoTotalBase = listaDetalles.reduce((acc, det) => acc + parseFloat(det.cantidad), 0);

            if (pesoTotalBase === 0) {
                alert("Error: La fórmula base suma 0 Kg. Revisa los ingredientes en el catálogo.");
                return;
            }

            // 5. Obtener el FACTOR de escalado (Regla de tres)
            const factor = pesoObjNum / pesoTotalBase;

            // 6. Calcular nuevos pesos para la producción
            const ingredientesCalculados = listaDetalles.map(det => {
                const pesoBaseIng = parseFloat(det.cantidad); // Usamos 'cantidad' según tu JSON
                const nuevoPeso = pesoBaseIng * factor;

                // Tolerancia viene como entero (ej: 20), lo convertimos a porcentaje
                const toleranciaPorcentaje = parseFloat(det.tolerancia || 0);
                const valorTolerancia = nuevoPeso * (toleranciaPorcentaje / 100);

                return {
                    iding: det.iding,
                    nombre: det.nombre_ingrediente || "Ingrediente",
                    pesing: nuevoPeso.toFixed(3),        // Peso objetivo escalado
                    pmax: (nuevoPeso + valorTolerancia).toFixed(3),
                    pmin: (nuevoPeso - valorTolerancia).toFixed(3),
                    pesado: 0
                };
            });

            // 7. Crear el objeto para la tabla visual en React
            const nuevaFormulaProduccion = {
                tempId: Date.now(),
                idform: formulaBackend.idform, // Usamos los datos frescos del backend
                nombre: formulaBackend.nombre,
                pesform: pesoObjNum,
                ingredientes: ingredientesCalculados
            };

            // Guardar en el estado
            setFormulasAgregadas([...formulasAgregadas, nuevaFormulaProduccion]);

            // Limpiar inputs
            setFormulaSeleccionadaId('');
            setPesoObjetivo('');

        } catch (error) {
            console.error("Error al obtener detalles de la fórmula:", error);
            alert("Error de conexión al buscar los detalles de la fórmula.");
        }
    };

    const handleRemoveFormula = (tempId) => {
        setFormulasAgregadas(formulasAgregadas.filter(f => f.tempId !== tempId));
    };

    // --- LÓGICA DE GUARDADO (POST LOOP) ---
    const handleRegistrarProduccion = async () => {
        if (!window.confirm("¿Estás seguro de registrar esta producción?")) return;

        setIsSaving(true);
        try {
            // Recorremos cada fórmula agregada y enviamos una petición individual
            // Esto permite que 1 Lote tenga N Fórmulas (N registros en tabla Produccion)
            const promesasDeGuardado = formulasAgregadas.map(formulaItem => {

                //obtenemos fecha
                const fechaLocal = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();

                // Construimos el Payload exacto para el Serializer de Produccion
                const payload = {
                    op: produccionData.orden,
                    lote: produccionData.lote,
                    idform: formulaItem.idform,
                    pesform: formulaItem.pesform,
                    estatus: 1, // 1 = Activa/En proceso
                    fecha: fechaLocal, // Fecha actual
                    idusu: user ? user.user_id : 1, // ID del usuario logueado

                    // Aquí va la lista anidada para DetalleProduccion
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

            // Esperamos a que TODAS las fórmulas se guarden
            await Promise.all(promesasDeGuardado);

            alert('¡Producción registrada exitosamente!');

            // Limpiar todo
            setPaso1Completo(false);
            setProduccionData({ orden: '', lote: '' });
            setFormulasAgregadas([]);
        } catch (error) {
            console.error("Error guardando producción:", error);
            alert("Hubo un error al guardar la producción. Revisa la consola.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Manejadores del Modal ---
    const handleOpenModal = (formula) => {
        setCurrentModalData(formula); // Pasamos la fórmula con sus ingredientes CALCULADOS
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentModalData(null);
    };

    // --- FUNCIÓN AUXILIAR DE FORMATEO ---
    const formatearValores = (valor) => {
        const numero = parseFloat(valor);
        if (isNaN(numero)) return '0.00';

        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numero);
    };


    return (
        <div className="produccion-page">

            <div className="action-bar">
                <button className="btn btn-default" onClick={() => {
                    setFormulasAgregadas([]);
                    setProduccionData({ orden: '', lote: '' });
                    setPaso1Completo(false);
                }} disabled={isSaving}>
                    <ClearAll /> Limpiar Formulario
                </button>
                <button className="btn btn-edit" disabled={isSaving}>
                    <Edit /> Consultar Producciones
                </button>
            </div>

            {/* --- PASO 1 --- */}
            <div className={`produccion-card-step ${paso1Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><AssignmentIcon /> Paso 1: Definir Producción</h2>
                <form onSubmit={handleDefinirProduccion} className="form-grid">
                    <div className="form-group">
                        <label htmlFor="orden">Orden Producción</label>
                        <input
                            type="text" // Cambiado a text por si tiene letras
                            id="orden"
                            name="orden"
                            value={produccionData.orden}
                            onChange={handlePaso1Change}
                            disabled={paso1Completo}
                            className="form-input"
                            placeholder="Ej: OP-1001"
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
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={paso1Completo}
                            style={{ width: '100%' }}
                        >
                            <SaveIcon fontSize="small" />
                            Seleccionar Fórmulas
                        </button>
                    </div>
                </form>
            </div>

            {/* --- PASO 2 --- */}
            <div className={`produccion-card-step ${!paso1Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><LibraryAddIcon /> Paso 2: Seleccionar Fórmulas</h2>

                <form onSubmit={handleAddFormula} className="form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="nombreFormula">Fórmula Base</label>
                        <select
                            id="nombreFormula"
                            className="form-select"
                            value={formulaSeleccionadaId}
                            onChange={(e) => setFormulaSeleccionadaId(e.target.value)}
                            disabled={!paso1Completo || isLoadingFormulas}
                        >
                            <option value="">
                                {isLoadingFormulas ? "Cargando..." : "Seleccionar fórmula..."}
                            </option>
                            {listaFormulasBase.map(f => (
                                <option key={f.idform} value={f.idform}>
                                    {f.nombre}
                                </option>
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
                        <button
                            type="submit"
                            className="btn btn-warning"
                            disabled={!paso1Completo}
                            style={{ width: '100%' }}
                        >
                            <AddIcon fontSize="small" />
                            Añadir Fórmula
                        </button>
                    </div>
                </form>
                <div className="divider"></div>
                <h3 className="subsection-title">Fórmulas en esta Producción</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre Fórmula</th>
                                <th>Peso Obj. (Kg)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formulasAgregadas.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', color: '#777' }}>
                                        No hay fórmulas agregadas.
                                    </td>
                                </tr>
                            ) : (
                                formulasAgregadas.map((formula) => (
                                    <tr key={formula.tempId}>
                                        <td>{formula.nombre}</td>
                                        <td>{formula.pesform.toFixed(2)}</td>
                                        <td className="col-acciones">
                                            <button
                                                className="icon-btn action-view"
                                                onClick={() => handleOpenModal(formula)}
                                            >
                                                <VisibilityIcon
                                                    style={{
                                                        backgroundColor: '#1B609DFF',   // fondo
                                                        borderRadius: '8px',          // esquinas redondeadas
                                                        padding: '6px',               // espacio interno alrededor del ícono
                                                        color: '#FFFFFF',                // color del ícono
                                                        fontSize: '32px'              // tamaño del ícono
                                                    }}
                                                />
                                            </button>
                                            <button
                                                className="icon-btn action-delete"
                                                onClick={() => handleRemoveFormula(formula.tempId)}
                                            >
                                                <DeleteIcon 
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

            {/* --- PASO 3 --- */}
            <div className={`produccion-card-step ${!paso1Completo || !paso2Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><PlaylistAddCheckIcon /> Paso 3: Resumen y Registro</h2>

                <div className="totals-grid">
                    <div className="total-box">
                        <p>Peso Total Lote</p>
                        <div className="total-value">{pesoTotal} Kg</div>
                    </div>
                    <div className="total-box">
                        <p>Fórmulas</p>
                        <div className="total-value">{totalFormulas}</div>
                    </div>
                </div>

                <div className="production-final-actions">
                    <button className="btn btn-secondary" disabled={!paso2Completo}>
                        <PrintIcon fontSize="small" /> Imprimir Reporte
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleRegistrarProduccion}
                        disabled={!paso2Completo || isSaving}
                    >
                        <Inventory2Icon fontSize="small" />
                        {isSaving ? 'Guardando...' : 'Registrar Producción'}
                    </button>
                </div>
            </div>

            {/* --- MODAL DETALLE --- */}
            {modalOpen && currentModalData && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Detalle Calculado: {currentModalData.nombre}</h4>
                            <button className="modal-close-btn" onClick={handleCloseModal}>
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p
                                className="modal-subtitle"
                                style={{
                                    backgroundColor: '#f0f4ff',   // color de fondo
                                    borderRadius: '8px',          // esquinas redondeadas
                                    padding: '6px 12px',          // espacio interno
                                    display: 'inline-block',      // que se ajuste al contenido
                                    color: '#333'                 // color de texto
                                }}

                            >
                                Lote: <strong>{produccionData.lote}</strong> | Objetivo: <strong>{currentModalData.pesform}</strong> Kg
                            </p>
                            <p className='modal-subtitle'>
                                Nota: Las cantidades han sido escaladas proporcionalmente según el Peso Objetivo del lote. Los rangos Min/Max reflejan el margen de error permitido (Tolerancia) por ingrediente.
                            </p>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Ingrediente</th>
                                            <th>Peso Calc (Kg)</th>
                                            <th>Min (Kg)</th>
                                            <th>Max (Kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentModalData.ingredientes.map((ing, idx) => (
                                            <tr key={idx}>
                                                <td>{ing.nombre}</td>
                                                <td style={{ textAlign: 'left' }}>{formatearValores(ing.pesing)}</td>
                                                <td style={{ textAlign: 'right', color: 'red' }}>{formatearValores(ing.pmin)}</td>
                                                <td style={{ textAlign: 'right', color: 'green' }}>{formatearValores(ing.pmax)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProduccionPage;