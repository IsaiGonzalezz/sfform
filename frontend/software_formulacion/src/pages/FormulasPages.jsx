import React, { useState, useMemo } from 'react';
import './styles/Formula.css'; // Importamos el CSS

// --- Iconos de MUI ---
import { 
    ReceiptLong, Science, PlaylistAddCheck, 
    Save, Add, Edit, Delete, ClearAll, Print 
} from '@mui/icons-material';

// --- Datos Falsos para el Select ---
const listaIngredientesMock = [
    { id: 1, nombre: 'Azúcar' },
    { id: 2, nombre: 'Agua' },
    { id: 3, nombre: 'Harina' },
    { id: 4, nombre: 'Sal' },
    { id: 5, nombre: 'Manteca' },
];

export default function FormulaPage() {
    
    // --- ESTADOS PRINCIPALES ---
    const [formulaDefinida, setFormulaDefinida] = useState(false);
    const [ingredientes, setIngredientes] = useState([]);
    
    const [formulaData, setFormulaData] = useState({
        id: '', 
        nombre: '',
        pesoTotal: ''
    });

    // El estado del ingrediente actual ahora guarda nombre E id
    const [currentIngrediente, setCurrentIngrediente] = useState({
        id: '',
        nombre: '',
        peso: '',
        tolerancia: ''
    });

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
            alert('Por favor, ingresa un ID y un Nombre para la fórmula.');
        }
    };

    // Manejador para los inputs simples (peso, tolerancia)
    const handleIngredienteChange = (e) => {
        const { name, value } = e.target;
        setCurrentIngrediente(prev => ({ ...prev, [name]: value }));
    };

    // --- NUEVO HANDLER para el <datalist> (Select2) ---
    const handleIngredienteSearchChange = (e) => {
        const nombre = e.target.value;
        // Buscamos en la lista de opciones si el nombre coincide
        const option = Array.from(document.querySelectorAll('#ingredientes-list option')).find(opt => opt.value === nombre);
        const id = option ? option.getAttribute('data-id') : ''; // Obtenemos el ID del 'data-id'
        
        setCurrentIngrediente(prev => ({
            ...prev,
            id: id, // Guardamos el ID
            nombre: nombre // Guardamos el Nombre
        }));
    };

    const handleAddIngrediente = (e) => {
        e.preventDefault();
        
        // --- VALIDACIÓN MEJORADA ---
        // Ahora validamos que el ID exista (que significa que fue seleccionado de la lista)
        if (!currentIngrediente.id || !currentIngrediente.peso || !currentIngrediente.tolerancia) {
            alert('Selecciona un ingrediente VÁLIDO de la lista y define su peso y tolerancia.');
            return;
        }

        setIngredientes([
            ...ingredientes,
            { ...currentIngrediente } // Ya tenemos ID y Nombre en el estado
        ]);

        // Resetea el formulario de ingrediente
        setCurrentIngrediente({ id: '', nombre: '', peso: '', tolerancia: '' });
    };

    const handleRemoveIngrediente = (idToRemove) => {
        // Usamos toString() por si acaso el ID del estado es string y el de la lista es número
        setIngredientes(ingredientes.filter(ing => ing.id.toString() !== idToRemove.toString()));
    };

    // (Resto de handlers sin cambios)
    const handleRegistrarFormula = (e) => {
        e.preventDefault();
        console.log('REGISTRANDO FÓRMULA:', {
            definicion: formulaData,
            ingredientes: ingredientes
        });
        alert('¡Fórmula registrada exitosamente!');
    };

    const handleLimpiarFormulario = () => {
        setFormulaDefinida(false);
        setIngredientes([]);
        setFormulaData({ id: '', nombre: '', pesoTotal: '' });
        setCurrentIngrediente({ id: '', nombre: '', peso: '', tolerancia: '' });
    };

    const handleFormulaChange = (e) => {
        const { name, value } = e.target;
        setFormulaData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="formula-page">
            
            {/* --- 0. Barra de Acciones Globales --- */}
            <div className="action-bar">
                <button className="btn btn-default" onClick={handleLimpiarFormulario}>
                    <ClearAll /> Limpiar Formulario
                </button>
                <button className="btn btn-default">
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
                            disabled={formulaDefinida} 
                            placeholder="Ej: FRM-001"
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
                            disabled={formulaDefinida}
                            placeholder="Ej: Caramelo Tipo A"
                        />
                    </div>

                    {/*
                    <div className="input-group">
                        <label htmlFor="pesoTotal">Peso Total Objetivo (Kg)</label>
                        <input 
                            type="number" 
                            id="pesoTotal" 
                            name="pesoTotal"
                            value={formulaData.pesoTotal}
                            onChange={handleFormulaChange}
                            disabled={formulaDefinida}
                            placeholder="Ej: 1250"
                        />
                    </div>
                    */}

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={formulaDefinida}>
                            <Save /> Guardar y Activar Ingredientes
                        </button>
                    </div>
                </form>
            </div>

            {/* --- 2. Sección: Selección de Ingredientes --- */}
            <div className={`formula-section ${!formulaDefinida ? 'locked' : ''}`}>
                <h2 className="section-title"><Science /> Paso 2: Agregar Ingredientes</h2>
                
                <form onSubmit={handleAddIngrediente} className="form-grid-ingredientes">
                    
                    {/* --- CAMBIO 2: <select> reemplazado por <input> con <datalist> --- */}
                    <div className="input-group">
                        <label htmlFor="nombreIngrediente">Nombre del Ingrediente</label>
                        <input 
                            list="ingredientes-list" 
                            id="nombreIngrediente"
                            name="nombre" // El 'name' ahora es 'nombre'
                            value={currentIngrediente.nombre}
                            onChange={handleIngredienteSearchChange} // Usa el nuevo handler
                            placeholder="Busca o escribe un ingrediente..."
                            autoComplete="off"
                        />
                        <datalist id="ingredientes-list">
                            {listaIngredientesMock.map(ing => (
                                // Guardamos el ID en 'data-id'
                                <option key={ing.id} data-id={ing.id} value={ing.nombre} />
                            ))}
                        </datalist>
                    </div>

                    <div className="input-group">
                        <label htmlFor="pesoIngrediente">Peso Objetivo</label>
                        <input 
                            type="number" 
                            id="pesoIngrediente" 
                            name="peso"
                            value={currentIngrediente.peso}
                            onChange={handleIngredienteChange} // Usa el handler simple
                            placeholder="Ej: 250"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="toleranciaIngrediente">Tolerancia (%)</label>
                        <input 
                            type="number" 
                            id="toleranciaIngrediente" 
                            name="tolerancia"
                            value={currentIngrediente.tolerancia}
                            onChange={handleIngredienteChange} // Usa el handler simple
                            placeholder="Ej: 10"
                        />
                    </div>

                    <div className="form-actions-ingredientes">
                        <button type="submit" className="btn btn-secondary">
                            <Add /> Agregar Ingrediente
                        </button>
                    </div>
                </form>

                {/* --- Tabla Dinámica de Ingredientes --- */}
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
                                        {/* --- CAMBIO 1: Botones con nuevas clases --- */}
                                        <td className="table-actions">
                                            <button className="btn-icon btn-icon-edit">
                                                <Edit />
                                            </button>
                                            <button 
                                                className="btn-icon btn-icon-delete" 
                                                onClick={() => handleRemoveIngrediente(ing.id)}
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
                    <button className="btn btn-default" disabled={ingredientes.length === 0}>
                        <Print /> Imprimir Detalle
                    </button>
                    <button 
                        className="btn btn-primary"
                        disabled={ingredientes.length === 0} 
                        onClick={handleRegistrarFormula}
                    >
                        <Save /> Registrar Fórmula Completa
                    </button>
                </div>

            </div>
        </div>
    );
}