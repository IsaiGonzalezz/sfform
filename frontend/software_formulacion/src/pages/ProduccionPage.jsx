import React, { useState, useMemo } from 'react';
import './styles/Produccion.css'; // Asegúrate que la ruta es correcta

// --- Importamos los iconos de MUI (Material-UI) ---
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
import {
    ReceiptLong, Science, PlaylistAddCheck,
    Save, Add, Edit, Delete, ClearAll, PictureAsPdf,
} from '@mui/icons-material';

// --- DATOS DE PRUEBA (Fórmulas disponibles para seleccionar) ---
const FORMULAS_DISPONIBLES = [
    { id: 'FRM-001', nombre: 'Caramelo Tipo A Super Extralargo Nombre para Pruebas' },
    { id: 'FRM-002', nombre: 'Gomita Base' }
];

// Datos de ejemplo para el modal (simulados)
const detalleIngredientes = [
    { id: 'ING-01', nombre: 'Azúcar', peso: 700.00 },
    { id: 'ING-02', nombre: 'Glucosa', peso: 300.00 },
    { id: 'ING-03', nombre: 'Agua', peso: 250.00 },
];

const ProduccionPage = () => {
    // --- ESTADOS DE PASOS ---
    const [paso1Completo, setPaso1Completo] = useState(false);

    // --- ESTADOS DE DATOS ---
    const [produccionData, setProduccionData] = useState({
        orden: '',
        lote: ''
    });

    // --- Estados para el formulario del PASO 2 ---
    const [formulaSeleccionadaId, setFormulaSeleccionadaId] = useState('');
    const [pesoObjetivo, setPesoObjetivo] = useState('');

    const [formulasAgregadas, setFormulasAgregadas] = useState([]);

    // --- ESTADOS DE UI ---
    const [modalOpen, setModalOpen] = useState(false);
    const [currentModalData, setCurrentModalData] = useState(null);

    // --- CÁLCULOS DERIVADOS (useMemo) ---
    const { pesoTotal, totalFormulas } = useMemo(() => {
        const peso = formulasAgregadas.reduce((acc, f) => acc + f.peso, 0);
        return {
            pesoTotal: peso.toFixed(2),
            totalFormulas: formulasAgregadas.length
        };
    }, [formulasAgregadas]);

    // Condición para habilitar el paso 3
    const paso2Completo = formulasAgregadas.length > 0;

    // --- MANEJADORES DE EVENTOS ---

    // Maneja el cambio en los inputs del Paso 1
    const handlePaso1Change = (e) => {
        const { name, value } = e.target;
        setProduccionData(prev => ({ ...prev, [name]: value }));
    };

    // Confirma el Paso 1 y desbloquea el Paso 2
    const handleDefinirProduccion = (e) => {
        e.preventDefault();
        if (produccionData.orden && produccionData.lote) {
            setPaso1Completo(true);
        } else {
            alert('Por favor, completa la Orden de Producción y el Lote.');
        }
    };

    // Añade la fórmula seleccionada a la tabla
    const handleAddFormula = (e) => {
        e.preventDefault();

        const pesoNum = parseFloat(pesoObjetivo);
        if (!formulaSeleccionadaId || !pesoObjetivo || pesoNum <= 0) {
            alert('Selecciona una fórmula E ingresa un Peso Objetivo válido (mayor a 0).');
            return;
        }

        const formulaBase = FORMULAS_DISPONIBLES.find(f => f.id === formulaSeleccionadaId);

        if (formulaBase) {
            if (formulasAgregadas.find(f => f.id === formulaBase.id)) {
                alert('Esa fórmula ya ha sido agregada a la producción.');
                return;
            }

            const formulaConPeso = {
                id: formulaBase.id,
                nombre: formulaBase.nombre,
                peso: pesoNum
            };

            setFormulasAgregadas([...formulasAgregadas, formulaConPeso]);

            setFormulaSeleccionadaId('');
            setPesoObjetivo('');
        }
    };

    // Quita una fórmula de la tabla
    const handleRemoveFormula = (idToRemove) => {
        setFormulasAgregadas(
            formulasAgregadas.filter(f => f.id !== idToRemove)
        );
    };

    // Lógica final del Paso 3
    const handleRegistrarProduccion = () => {
        console.log("--- REGISTRANDO PRODUCCIÓN ---");
        console.log("Datos de Cabecera:", produccionData);
        console.log("Fórmulas Incluidas:", formulasAgregadas);
        console.log("Totales:", { pesoTotal, totalFormulas });

        alert('Producción registrada (revisa la consola).');

        // Limpiar formulario
        setPaso1Completo(false);
        setProduccionData({ orden: '', lote: '' });
        setFormulasAgregadas([]);
        setFormulaSeleccionadaId('');
        setPesoObjetivo('');
    };

    // --- Manejadores del Modal ---
    const handleOpenModal = (formula) => {
        setCurrentModalData(formula);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentModalData(null);
    };


    return (
        // Contenedor de página: organiza las tarjetas de pasos
        <div className="produccion-page">

            <div className="action-bar">
                <button className="btn btn-default" > {/*  onClick={handleLimpiarFormulario} disabled={isSaving}* */}
                    <ClearAll /> Limpiar Formulario
                </button>
                <button className="btn btn-edit"> {/* disabled={isSaving} onClick={() => setShowConsultar(true)} */}
                    <Edit /> Consultar Producciones
                </button>
            </div>

            {/* --- PASO 1: DEFINIR PRODUCCIÓN (Tarjeta 1) --- */}
            <div className={`produccion-card-step ${paso1Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><AssignmentIcon /> Paso 1: Definir Producción</h2>

                {/* --- CAMBIO: Botón movido DENTRO del grid --- */}
                <form onSubmit={handleDefinirProduccion} className="form-grid">
                    <div className="form-group">
                        <label htmlFor="orden">Orden Producción</label>
                        <input
                            type="number"
                            id="orden"
                            name="orden"
                            value={produccionData.orden}
                            onChange={handlePaso1Change}
                            disabled={paso1Completo}
                            className="form-input"
                            placeholder="Ej: 1001"
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
                    {/* --- CAMBIO: Botón alineado como 3ra columna --- */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={paso1Completo}
                            style={{ width: '100%' }} // Ocupa todo el espacio de su celda
                        >
                            <SaveIcon fontSize="small" />
                            Seleccionar Formulas
                        </button>
                    </div>
                </form>
            </div>

            {/* --- PASO 2: SELECCIÓN DE FÓRMULAS (Tarjeta 2) --- */}
            <div className={`produccion-card-step ${!paso1Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><LibraryAddIcon /> Paso 2: Seleccionar Fórmulas</h2>

                <form onSubmit={handleAddFormula} className="form-grid">

                    {/* --- CAMBIO: Select ocupa 2 columnas --- */}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="nombreFormula">Fórmula</label>
                        <select
                            id="nombreFormula"
                            className="form-select"
                            value={formulaSeleccionadaId}
                            onChange={(e) => setFormulaSeleccionadaId(e.target.value)}
                            disabled={!paso1Completo}
                        >
                            <option value="">Seleccionar fórmula...</option>
                            {FORMULAS_DISPONIBLES.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.nombre} (ID: {f.id})
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
                                <th>ID Fórmula</th>
                                <th>Nombre Fórmula</th>
                                <th>Peso Obj. (Kg)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formulasAgregadas.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', color: '#777' }}>
                                        {paso1Completo ? 'Añade fórmulas desde el selector de arriba.' : 'Completa el Paso 1 para empezar.'}
                                    </td>
                                </tr>
                            ) : (
                                formulasAgregadas.map((formula) => (
                                    <tr key={formula.id}>
                                        <td>{formula.id}</td>
                                        <td>{formula.nombre}</td>
                                        <td>{formula.peso.toFixed(2)}</td>
                                        <td className="col-acciones">
                                            <button
                                                className="icon-btn action-view"
                                                onClick={() => handleOpenModal(formula)}
                                                disabled={!paso1Completo}
                                            >
                                                <VisibilityIcon />
                                            </button>
                                            <button
                                                className="icon-btn action-delete"
                                                onClick={() => handleRemoveFormula(formula.id)}
                                                disabled={!paso1Completo}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* --- PASO 3: RESUMEN Y REGISTRO (Tarjeta 3) --- */}
            <div className={`produccion-card-step ${!paso1Completo || !paso2Completo ? 'locked' : ''}`}>
                <h2 className="section-title"><PlaylistAddCheckIcon /> Paso 3: Resumen y Registro</h2>

                <div className="totals-grid">
                    <div className="total-box">
                        <p>Peso Total Acumulado</p>
                        <div className="total-value">{pesoTotal} Kg</div>
                    </div>
                    <div className="total-box">
                        <p>Total de Fórmulas</p>
                        <div className="total-value">{totalFormulas}</div>
                    </div>
                </div>

                <div className="production-final-actions">
                    <button
                        className="btn btn-secondary"
                        disabled={!paso1Completo || !paso2Completo}
                    >
                        <PrintIcon fontSize="small" />
                        Imprimir Reporte
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleRegistrarProduccion}
                        disabled={!paso1Completo || !paso2Completo}
                    >
                        <Inventory2Icon fontSize="small" />
                        Registrar Producción Completa
                    </button>

                </div>
            </div>

            {/* --- MODAL PARA VER DETALLE (Sin cambios estructurales) --- */}
            {modalOpen && currentModalData && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Detalle de Fórmula: {currentModalData.nombre}</h4>
                            <button
                                className="modal-close-btn"
                                onClick={handleCloseModal}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-subtitle">
                                Ingredientes para Lote {produccionData.lote} (Peso Obj. {currentModalData.peso.toFixed(2)} Kg)
                            </p>

                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID Ingrediente</th>
                                            <th>Nombre Ingrediente</th>
                                            <th>Peso Obj. (Kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalleIngredientes.map((ing) => (
                                            <tr key={ing.id}>
                                                <td>{ing.id}</td>
                                                <td>{ing.nombre}</td>
                                                <td>{ing.peso.toFixed(2)}</td>
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