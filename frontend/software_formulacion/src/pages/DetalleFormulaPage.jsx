import React, { useState, useMemo ,useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Trash2, Edit3, Check, Plus } from 'lucide-react';
import { useAuth } from '../context/useAuth';


//INSTANCIA A LA API
const API_URL_FORMULAS_REL = '/formulas/'



const DetalleFormulaPage = () => {

    const { axiosInstance } = useAuth();

    const { id } = useParams(); // Obtiene el ID de la URL (ej: FRM-001)
    const navigate = useNavigate();

    // Estados
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Estado para almacenar la data original
    const [formula, setFormula] = useState(null);

    // Estado para manejar los cambios del formulario (Edición)
    const [formData, setFormData] = useState({
        nombre: '',
        detalles: [] // Aquí viven los ingredientes cargados
    });

    // 1. GET: Cargar la fórmula al iniciar
    useEffect(() => {
        const fetchFormula = async () => {
            try {
                // Ajusta la URL base a tu configuración local
                const response = await axiosInstance.get(`${API_URL_FORMULAS_REL}${id}/`);
                setFormula(response.data);
                setFormData(response.data); // Inicializamos el form con los datos traídos
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar la fórmula. Verifica la conexión.');
                setLoading(false);
            }
        };
        fetchFormula();
    }, [id]);

    const formatNumero = (num) => {
        const numeroLimpo = parseFloat(num || 0);
        // 'en-US' usa coma (,) para miles y punto (.) para decimal
        return numeroLimpo.toLocaleString('en-US', {
            maximumFractionDigits: 3 
        });
    };

    const [pesoTotal, totalIngredientes] = useMemo(() => {
        const detalles = formData.detalles || [];
        
        // 1. Calcula el total
        const total = detalles.reduce((sum, d) => sum + parseFloat(d.cantidad || 0), 0);
        // 2. Cuenta los ingredientes
        const count = detalles.length;

        // Devuelve los valores (el peso ya formateado)
        return [formatNumero(total), count];

    }, [formData.detalles]);

    // Manejadores de Inputs (Nombre)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Manejadores de Inputs (Ingredientes en la tabla)
    const handleDetalleChange = (index, field, value) => {
        const nuevosDetalles = [...formData.detalles];
        nuevosDetalles[index][field] = value;
        setFormData({ ...formData, detalles: nuevosDetalles });
    };

    // 2. PATCH: Guardar Cambios
    const handleSave = async () => {
        try {
            
            const payload = {
                nombre: formData.nombre,
                // Mapeamos solo lo que el serializer necesita para escribir
                ingredientes: formData.detalles.map(d => ({
                    iding: d.iding, // ID del ingrediente
                    cantidad: parseFloat(d.cantidad),
                    tolerancia: parseInt(d.tolerancia)
                }))
            };

            await axiosInstance.patch(`${API_URL_FORMULAS_REL}${id}/`, payload);

            alert('Fórmula actualizada correctamente');
            setIsEditing(false);
            // Recargamos los datos "oficiales"
            setFormula(formData);

        } catch (err) {
            console.error(err);
            alert('Error al actualizar. Revisa la consola.');
        }
    };

    // 3. DELETE: Eliminar Fórmula <DESCARTADO>
    const handleDelete = async () => {
        if (window.confirm(`¿Estás seguro de eliminar la fórmula ${id}? Esta acción no se puede deshacer.`)) {
            try {
                await axiosInstance.delete(`${API_URL_FORMULAS_REL}${id}/`);
                alert('Fórmula eliminada.');
                navigate('/formulas'); // Te regresa a la lista principal
            } catch (err) {
                console.error(err);
                alert('Error al eliminar.');
            }
        }
    };

    // Cancelar edición (revertir cambios) DESCARTADO
    const handleCancel = () => {
        setFormData(formula); // Regresamos a los datos originales
        setIsEditing(false);
    };

    // --- RENDERIZADO ---

    if (loading) return <div style={styles.centerMsg}>Cargando detalles...</div>;
    if (error) return <div style={styles.centerMsgError}>{error}</div>;
    if (!formula) return null;

    return (
        <div style={styles.container}>
            {/* Encabezado */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} /> Volver
                </button>
                <div style={styles.titleContainer}>
                    <h1 style={styles.title}>
                        {isEditing ? 'Editando: ' : 'Detalle de: '}
                        <span style={{ color: '#4DF764FF' }}>{formula.idform}</span>
                    </h1>
                </div>

                {/* Botones de Acción Principal */}
                <div style={styles.actions}>
                    {!isEditing ? (
                        <>
                            {/* BOTON DE ELIMINACION DESCARTADO  * */}
                            <button style={{ ...styles.btnDelete, display: 'none' }} onClick={handleDelete} hidden={true}>
                                <Trash2 size={18} /> Eliminar
                            </button>

                            <button style={{ ...styles.btnEdit }} onClick={() => setIsEditing(true)} hidden={true}>
                                <Edit3 size={18} /> Editar
                            </button>
                        </>
                    ) : (
                        <>
                            <button style={styles.btnCancel} onClick={handleCancel}>
                                <X size={18} /> Cancelar
                            </button>
                            <button style={styles.btnSave} onClick={handleSave}>
                                <Save size={18} /> Guardar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Formulario Principal */}
            <div style={styles.card}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre de la Fórmula</label>
                    {isEditing ? (
                        <input
                            style={styles.input}
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                        />
                    ) : (
                        <p style={styles.textData}>{formula.nombre}</p>
                    )}
                    <div style={{padding: '10px'}}>
                    </div>
                    <div className="summary-grid">
                        <div className="summary-card">
                            <span className="summary-label">Peso Total Calculado</span>
                            <span className="summary-value">{pesoTotal} Kg</span>
                        </div>
                        <div className="summary-card">
                            <span className="summary-label">Total de Ingredientes</span>
                            <span className="summary-value">{totalIngredientes}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Ingredientes */}
            <div style={styles.card}>
                <h3 style={styles.subTitle}>Ingredientes / Composición</h3>
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Ingrediente</th>
                                <th style={styles.th}>Cantidad (kg/L)</th>
                                <th style={styles.th}>Tolerancia (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.detalles.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #444' }}>
                                    <td style={styles.td}>
                                        {/* El nombre del ingrediente suele ser read-only incluso al editar la formula, 
                                            a menos que quieras cambiar el ingrediente en sí, lo cual es más complejo */}
                                        {item.nombre_ingrediente || `Ingrediente ID: ${item.iding}`}
                                    </td>
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                style={styles.inputTable}
                                                value={item.cantidad}
                                                onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                                            />
                                        ) : (
                                            <span>{item.cantidad}</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                style={styles.inputTable}
                                                value={item.tolerancia}
                                                onChange={(e) => handleDetalleChange(index, 'tolerancia', e.target.value)}
                                            />
                                        ) : (
                                            <span>{item.tolerancia} %</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {formData.detalles.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                                        Esta fórmula no tiene ingredientes registrados.
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

const styles = {
    container: {
        minHeight: '100vh',
        // Fondo dinámico (Gris claro en día / Negro en noche)
        backgroundColor: 'var(--bg-color)', 
        color: 'var(--text-color)',
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease'
    },
    centerMsg: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
        backgroundColor: 'var(--bg-color)', 
        color: 'var(--text-color)', 
        fontSize: '1.2rem'
    },
    centerMsgError: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
        backgroundColor: 'var(--bg-color)', 
        color: '#ff6b6b', // El rojo de error se ve bien en ambos
        fontSize: '1.2rem'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '1px solid var(--border-color)', // Borde dinámico
        paddingBottom: '20px'
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-color)', // El icono de volver se adapta
        opacity: 0.6, // Le damos opacidad para que parezca secundario
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '1rem',
        transition: 'opacity 0.2s'
    },
    titleContainer: {
        flex: 1,
        marginLeft: '20px'
    },
    title: {
        margin: 0,
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: 'var(--text-color)'
    },
    actions: {
        display: 'flex',
        gap: '15px'
    },
    // --- BOTONES ---
    // (Los colores de fondo se mantienen fijos porque son indicadores de estado,
    // y el texto 'white' se mantiene porque esos colores son oscuros/fuertes)
    btnEdit: {
        backgroundColor: '#E66722FF', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    btnDelete: {
        backgroundColor: '#fa5252', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    btnSave: {
        backgroundColor: '#40c057', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    btnCancel: {
        backgroundColor: '#495057', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    // --- TARJETAS Y FORMULARIO ---
    card: {
        // Fondo de tarjeta (Blanco en día / Gris oscuro en noche)
        backgroundColor: 'var(--card-bg)', 
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // Sombra más suave
        marginBottom: '25px',
        transition: 'background-color 0.3s ease'
    },
    formGroup: {
        marginBottom: '10px'
    },
    label: {
        display: 'block',
        color: 'var(--text-color)',
        opacity: 0.7, // Grisáceo visualmente
        fontSize: '0.9rem',
        marginBottom: '8px'
    },
    textData: {
        fontSize: '1.5rem',
        color: 'var(--text-color)', // Texto principal
        margin: 0
    },
    input: {
        width: '100%',
        padding: '12px',
        // Truco: Usamos el color de fondo general para el input dentro de la tarjeta
        backgroundColor: 'var(--bg-color)', 
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        color: 'var(--text-color)',
        fontSize: '1.1rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    // --- TABLA ---
    subTitle: {
        marginTop: 0,
        marginBottom: '20px',
        borderLeft: '4px solid #4dabf7',
        paddingLeft: '10px',
        color: 'var(--text-color)'
    },
    tableContainer: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        color: 'var(--text-color)'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '2px solid var(--border-color)',
        color: 'var(--text-color)',
        opacity: 0.8
    },
    td: {
        padding: '15px 12px',
        borderBottom: '1px solid var(--border-color)' // Agregué borde a las filas para mejor lectura
    },
    inputTable: {
        width: '100px',
        padding: '8px',
        backgroundColor: 'var(--bg-color)', // Mismo truco que arriba
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        color: 'var(--text-color)',
        textAlign: 'center'
    }
};

export default DetalleFormulaPage;