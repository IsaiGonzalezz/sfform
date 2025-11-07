import React, { useState } from 'react';
import './styles/Produccion.css'; // Ruta corregida si Produccion.css está en src/pages/styles

// --- Importamos los iconos de MUI (Material-UI) ---
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2Icon from '@mui/icons-material/Inventory2'; // Para Registrar Producción
import PrintIcon from '@mui/icons-material/Print'; // Para Imprimir Reporte

// Datos de ejemplo para la tabla
const formulasRegistradas = [
    {
        id: 'FRM-001',
        nombre: 'Caramelo Tipo A',
        peso: 1250.00,
        lote: 'L-2025-001'
    },
    {
        id: 'FRM-002',
        nombre: 'Gomita Base',
        peso: 800.00,
        lote: 'L-2025-002'
    }
];

// Datos de ejemplo para el modal
const detalleIngredientes = [
    { id: 'ING-01', nombre: 'Azúcar', peso: 700.00 },
    { id: 'ING-02', nombre: 'Glucosa', peso: 300.00 },
    { id: 'ING-03', nombre: 'Agua', peso: 250.00 },
];

const ProduccionPage = () => {
    const [modalOpen, setModalOpen] = useState(false);
    
    // --- Totales Calculados ---
    const pesoTotal = formulasRegistradas.reduce((acc, f) => acc + f.peso, 0);
    const totalFormulas = formulasRegistradas.length;

    return (
        <div className="">
            <div className="produccion-content-card">
                
                {/* --- SECCIÓN 1: FORMULARIO DE INGRESO --- */}
                <h2 className="section-title">Ingresar Fórmula a Producción</h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="ordenProduccion">Orden Producción</label>
                        <input type="text" id="ordenProduccion" className="form-input" placeholder="Ej: OP-001" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nombreFormula">Fórmula</label>
                        <select id="nombreFormula" className="form-select">
                            <option value="">Seleccionar fórmula...</option>
                            <option value="FRM-001">Caramelo Tipo A</option>
                            <option value="FRM-002">Gomita Base</option>
                            <option value="FRM-003">Base Chocolate</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="pesoObjetivo">Peso Objetivo (Kg)</label>
                        <input type="number" id="pesoObjetivo" className="form-input" placeholder="0.00" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lote">Lote</label>
                        <input type="text" id="lote" className="form-input" placeholder="Ej: L-2025-003" />
                    </div>
                </div>
                <div className="form-actions">
                    <button className="btn btn-primary">
                        <AddIcon fontSize="small" /> 
                        Añadir Fórmula
                    </button>
                </div>

                {/* --- SECCIÓN 2: RESUMEN DE PRODUCCIÓN --- */}
                <div className="divider"></div>
                
                <h2 className="section-title" style={{ marginTop: '2rem' }}>
                    Resumen de Producción
                </h2>

                {/* --- Tabla de Resumen --- */}
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Fórmula</th>
                                <th>Nombre Fórmula</th>
                                <th>Peso Obj. (Kg)</th>
                                <th>Lote</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formulasRegistradas.map((formula) => (
                                <tr key={formula.id}>
                                    <td>{formula.id}</td>
                                    <td>{formula.nombre}</td>
                                    <td>{formula.peso.toFixed(2)}</td>
                                    <td>{formula.lote}</td>
                                    <td className="col-acciones">
                                        <button 
                                            className="icon-btn action-view"
                                            onClick={() => setModalOpen(true)}
                                        >
                                            <VisibilityIcon />
                                        </button>
                                        <button className="icon-btn action-delete">
                                            <DeleteIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- Totales --- */}
                <div className="totals-grid">
                    <div className="total-box">
                        <p>Peso Total Acumulado</p>
                        <div className="total-value">{pesoTotal.toFixed(2)} Kg</div>
                    </div>
                    <div className="total-box">
                        <p>Total de Fórmulas</p>
                        <div className="total-value">{totalFormulas}</div>
                    </div>
                </div>

                {/* --- Botones de Acción de Producción --- */}
                <div className="production-final-actions">
                    <button className="btn btn-primary">
                        <Inventory2Icon fontSize="small" />
                        Registrar Producción
                    </button>
                    <button className="btn btn-secondary"> {/* Nuevo estilo de botón */}
                        <PrintIcon fontSize="small" />
                        Imprimir Reporte
                    </button>
                </div>

            </div>

            {/* --- MODAL PARA VER DETALLE --- */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Detalle de Fórmula: Caramelo Tipo A</h4>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setModalOpen(false)}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-subtitle">Ingredientes para Lote L-2025-001 (Peso Obj. 1250.00 Kg)</p>
                            
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