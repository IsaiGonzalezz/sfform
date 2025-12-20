import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Trash2, Edit3, Check, Loader } from 'lucide-react'; // Agregué Loader
import { useAuth } from '../context/useAuth';

// INSTANCIA A LA API
const API_URL_FORMULAS_REL = '/formulas/';

const DetalleFormulaPage = () => {

    const { axiosInstance } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados de Carga Inicial
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado de Edición
    const [isEditing, setIsEditing] = useState(false);
    
    // --- NUEVO: Estado para bloquear botón de guardar ---
    const [isSaving, setIsSaving] = useState(false);

    // --- NUEVO: Estado para la notificación tipo iPhone ---
    const [toast, setToast] = useState({ show: false, message: '' });

    // Estado para almacenar la data original
    const [formula, setFormula] = useState(null);

    // Estado para manejar los cambios del formulario (Edición)
    const [formData, setFormData] = useState({
        nombre: '',
        detalles: []
    });

    // 1. GET: Cargar la fórmula al iniciar
    useEffect(() => {
        const fetchFormula = async () => {
            try {
                const response = await axiosInstance.get(`${API_URL_FORMULAS_REL}${id}/`);
                setFormula(response.data);
                setFormData(response.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar la fórmula. Verifica la conexión.');
                setLoading(false);
            }
        };
        fetchFormula();
    }, [id, axiosInstance]);

    // Función para mostrar la notificación temporal
    const showSuccessToast = () => {
        setToast({ show: true, message: 'Datos Modificados Correctamente' });
        // Se oculta sola después de 3 segundos
        setTimeout(() => {
            setToast({ show: false, message: '' });
        }, 3000);
    };

    const formatNumero = (num) => {
        const numeroLimpo = parseFloat(num || 0);
        return numeroLimpo.toLocaleString('en-US', {
            maximumFractionDigits: 3 
        });
    };

    const [pesoTotal, totalIngredientes] = useMemo(() => {
        const detalles = formData.detalles || [];
        const total = detalles.reduce((sum, d) => sum + parseFloat(d.cantidad || 0), 0);
        const count = detalles.length;
        return [formatNumero(total), count];
    }, [formData.detalles]);

    // Manejadores de Inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDetalleChange = (index, field, value) => {
        const nuevosDetalles = [...formData.detalles];
        nuevosDetalles[index][field] = value;
        setFormData({ ...formData, detalles: nuevosDetalles });
    };

    // 2. PATCH: Guardar Cambios (MODIFICADO)
    const handleSave = async () => {
        // Prevención: Si ya está guardando, no hace nada
        if (isSaving) return;

        setIsSaving(true); // Bloqueamos el botón

        try {
            const payload = {
                nombre: formData.nombre,
                ingredientes: formData.detalles.map(d => ({
                    iding: d.iding,
                    cantidad: parseFloat(d.cantidad),
                    tolerancia: parseInt(d.tolerancia)
                }))
            };

            await axiosInstance.patch(`${API_URL_FORMULAS_REL}${id}/`, payload);

            // --- CAMBIO: En vez de alert, usamos el Toast ---
            showSuccessToast();
            
            setIsEditing(false);
            setFormula(formData); // Actualizamos la data oficial

        } catch (err) {
            console.error(err);
            alert('Error al actualizar. Revisa la consola.');
        } finally {
            // Liberamos el botón (sea éxito o error)
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`¿Estás seguro de eliminar la fórmula ${id}? Esta acción no se puede deshacer.`)) {
            try {
                await axiosInstance.delete(`${API_URL_FORMULAS_REL}${id}/`);
                alert('Fórmula eliminada.');
                navigate('/formulas');
            } catch (err) {
                console.error(err);
                alert('Error al eliminar.');
            }
        }
    };

    const handleCancel = () => {
        setFormData(formula);
        setIsEditing(false);
    };

    // --- RENDERIZADO ---

    if (loading) return <div style={styles.centerMsg}>Cargando detalles...</div>;
    if (error) return <div style={styles.centerMsgError}>{error}</div>;
    if (!formula) return null;

    return (
        <div style={styles.container}>
            
            {/* --- NOTIFICACIÓN TOAST (FLOTANTE) --- */}
            {toast.show && (
                <div style={styles.toast}>
                    <div style={styles.toastIconContainer}>
                        <Check size={16} color="#fff" strokeWidth={3} />
                    </div>
                    {toast.message}
                </div>
            )}

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
                            {/* BOTON DE ELIMINACION DESCARTADO */}
                            <button style={{ ...styles.btnDelete, display: 'none' }} onClick={handleDelete} hidden={true}>
                                <Trash2 size={18} /> Eliminar
                            </button>

                            <button style={{ ...styles.btnEdit }} onClick={() => setIsEditing(true)} hidden={true}>
                                <Edit3 size={18} /> Editar
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                style={{...styles.btnCancel, opacity: isSaving ? 0.5 : 1}} 
                                onClick={handleCancel}
                                disabled={isSaving} // También bloqueamos cancelar si está guardando
                            >
                                <X size={18} /> Cancelar
                            </button>
                            
                            {/* --- BOTÓN GUARDAR MODIFICADO --- */}
                            <button 
                                style={{
                                    ...styles.btnSave, 
                                    opacity: isSaving ? 0.7 : 1, 
                                    cursor: isSaving ? 'not-allowed' : 'pointer'
                                }} 
                                onClick={handleSave}
                                disabled={isSaving} // Deshabilita click nativo
                            >
                                {isSaving ? (
                                    <>
                                        {/* Icono giratorio simple */}
                                        <Loader size={18} className="spin-animation" /> Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} /> Guardar
                                    </>
                                )}
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
                            disabled={isSaving} // Bloqueamos input al guardar
                        />
                    ) : (
                        <p style={styles.textData}>{formula.nombre}</p>
                    )}
                    <div style={{padding: '10px'}}></div>
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
                                        {item.nombre_ingrediente || `Ingrediente ID: ${item.iding}`}
                                    </td>
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                style={styles.inputTable}
                                                value={item.cantidad}
                                                onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                                                disabled={isSaving} // Bloqueamos input al guardar
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
                                                disabled={isSaving} // Bloqueamos input al guardar
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
            
            {/* Estilo para la animación del loader */}
            <style>{`
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const styles = {
    // --- ESTILOS DE TOAST (NUEVO) ---
    toast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#f0fdf4', // Fondo muy claro verdoso (tipo Apple light mode success)
        color: '#15803d', // Texto verde oscuro elegante
        padding: '12px 24px',
        borderRadius: '50px', // Bordes redondos tipo píldora
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Sombra suave
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: '600',
        fontSize: '0.95rem',
        zIndex: 9999,
        border: '1px solid #bbf7d0', // Borde sutil
        animation: 'slideIn 0.3s ease-out'
    },
    toastIconContainer: {
        backgroundColor: '#22c55e', // Verde brillante Apple
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    // -------------------------------
    
    container: {
        minHeight: '100vh',
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
        color: '#ff6b6b', 
        fontSize: '1.2rem'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '20px'
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-color)', 
        opacity: 0.6, 
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
        borderRadius: '6px', 
        // El cursor se maneja dinámicamente arriba, pero dejamos este por defecto
        display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold',
        transition: 'opacity 0.2s'
    },
    btnCancel: {
        backgroundColor: '#495057', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold',
        transition: 'opacity 0.2s'
    },
    card: {
        backgroundColor: 'var(--card-bg)', 
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
        marginBottom: '25px',
        transition: 'background-color 0.3s ease'
    },
    formGroup: {
        marginBottom: '10px'
    },
    label: {
        display: 'block',
        color: 'var(--text-color)',
        opacity: 0.7, 
        fontSize: '0.9rem',
        marginBottom: '8px'
    },
    textData: {
        fontSize: '1.5rem',
        color: 'var(--text-color)', 
        margin: 0
    },
    input: {
        width: '100%',
        padding: '12px',
        backgroundColor: 'var(--bg-color)', 
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        color: 'var(--text-color)',
        fontSize: '1.1rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
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
        borderBottom: '1px solid var(--border-color)' 
    },
    inputTable: {
        width: '100px',
        padding: '8px',
        backgroundColor: 'var(--bg-color)', 
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        color: 'var(--text-color)',
        textAlign: 'center'
    }
};

export default DetalleFormulaPage;