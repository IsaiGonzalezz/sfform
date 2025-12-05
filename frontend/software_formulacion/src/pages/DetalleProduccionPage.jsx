import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Edit3, Layers } from 'lucide-react'; // Agregué el icono Layers
import { useAuth } from '../context/useAuth';

const API_URL_PRODUCCION_REL = '/produccion/';

const DetalleProduccionPage = () => {

    const { axiosInstance } = useAuth();
    const { folio } = useParams(); // Este es el ID de la fórmula actual que estamos viendo
    const navigate = useNavigate();

    // Estados
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Estado para almacenar la data original
    const [produccionOriginal, setProduccionOriginal] = useState(null);

    // --- NUEVO: Estado para las pestañas (hermanos de la misma OP) ---
    const [formulasHermanas, setFormulasHermanas] = useState([]);

    // Estado para manejar los cambios del formulario
    const [formData, setFormData] = useState({
        id: '', // Importante guardar el ID
        op: '',
        lote: '',
        pesform: 0,
        detalles: []
    });

    // 1. GET: Cargar la Producción Actual y buscar Hermanos
    useEffect(() => {
        const fetchProduccion = async () => {
            setLoading(true); // Reiniciar loading al cambiar de folio
            try {
                // A) Cargar la fórmula principal solicitada por URL
                const response = await axiosInstance.get(`${API_URL_PRODUCCION_REL}${folio}/`);
                const dataActual = response.data;

                setProduccionOriginal(dataActual);
                setFormData(dataActual);

                // B) --- MAGIA AQUÍ --- 
                // Usamos el campo 'op' para buscar otras fórmulas de esta misma orden.
                // Asumimos que tu backend permite filtrar ?search= o ?op=. 
                // Si no, tendrás que ajustar este endpoint.
                if (dataActual.op) {
                    try {
                        // Intentamos buscar por el nombre de la OP
                        const searchRes = await axiosInstance.get(`${API_URL_PRODUCCION_REL}?search=${dataActual.op}`);

                        // Filtramos para asegurarnos que son EXACTAMENTE de esta OP
                        // (Por si el search trae cosas parecidas)
                        const hermanos = searchRes.data.filter(f => f.op === dataActual.op);

                        // Si encontramos hermanos, los guardamos para las pestañas
                        if (hermanos.length > 0) {
                            setFormulasHermanas(hermanos);
                        }
                    } catch (errorHermanos) {
                        console.warn("No se pudieron cargar fórmulas relacionadas", errorHermanos);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar la producción. Verifica la conexión.');
                setLoading(false);
            }
        };
        fetchProduccion();
    }, [folio, axiosInstance]); // Se ejecuta cada vez que cambia el 'folio' en la URL

    // --- FORMATEO DE NÚMEROS ---
    const formatNumero = (num) => {
        const numeroLimpo = parseFloat(num || 0);
        return numeroLimpo.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Cálculos de Resumen
    const [sumaIngredientes, totalItems] = useMemo(() => {
        const detalles = formData.detalles || [];
        const total = detalles.reduce((sum, d) => sum + parseFloat(d.pesing || 0), 0);
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

    // 2. PATCH: Guardar Cambios
    const handleSave = async () => {
        try {
            const payload = {
                op: formData.op,
                lote: formData.lote,
                pesform: parseFloat(formData.pesform),
                detalles: formData.detalles.map(d => ({
                    iding: d.iding,
                    pesing: parseFloat(d.pesing),
                    pmax: parseFloat(d.pmax),
                    pmin: parseFloat(d.pmin),
                    pesado: d.pesado
                }))
            };

            await axiosInstance.patch(`${API_URL_PRODUCCION_REL}${folio}/`, payload);

            alert('Producción actualizada correctamente');
            setIsEditing(false);
            setProduccionOriginal(formData);

            // Actualizamos la lista de hermanos por si cambió algún dato clave
            // (Opcional, pero recomendado)

        } catch (err) {
            console.error(err);
            alert('Error al actualizar. Revisa la consola.');
        }
    };

    const handleCancel = () => {
        setFormData(produccionOriginal);
        setIsEditing(false);
    };

    // --- RENDERIZADO ---

    if (loading) return <div style={styles.centerMsg}>Cargando producción...</div>;
    if (error) return <div style={styles.centerMsgError}>{error}</div>;
    if (!produccionOriginal) return null;

    // Ordenar hermanos para que salgan en orden (por ejemplo por ID o folio)
    const pestañasOrdenadas = [...formulasHermanas].sort((a, b) => a.id - b.id);

    return (
        <div style={styles.container}>
            {/* Encabezado */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} /> Volver
                </button>
                <div style={styles.titleContainer}>
                    <h1 style={styles.title}>
                        {isEditing ? 'Editando OP: ' : 'Detalle OP: '}
                        <span style={{ color: '#4DF764FF' }}>{formData.op}</span>
                    </h1>
                    <p style={{ color: '#888', margin: 0 }}>
                        Folio Interno: {produccionOriginal.folio || produccionOriginal.folioReal}
                    </p>
                </div>

                <div style={styles.actions}>
                    {!isEditing ? (
                        <button style={styles.btnEdit} onClick={() => setIsEditing(true)}>
                            <Edit3 size={18}
                            /> Editar
                        </button>
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

            {/* --- SECCIÓN DE PESTAÑAS --- */}
            {pestañasOrdenadas.length > 1 && (
                <div style={styles.tabsContainer}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#888' }}>
                        <Layers size={16} /> <span style={{ fontSize: '0.9rem' }}>Fórmulas en esta Orden:</span>
                    </div>
                    <div style={styles.tabsRow}>
                        {/* AGREGAMOS EL ÍNDICE 'i' AQUÍ ABAJO v */}
                        {pestañasOrdenadas.map((item, i) => {
                            const isActive = String(item.id) === String(folio) || String(item.folio) === String(folio);

                            // --- CORRECCIÓN DEL KEY ---
                            // Usamos item.id. Si no existe, usamos item.folio. Si no, usamos el índice 'i'.
                            // Esto elimina el error rojo para siempre.
                            const uniqueKey = item.id || item.folio || i;

                            return (
                                <button
                                    key={uniqueKey} // <--- AQUÍ ESTABA EL DETALLE
                                    onClick={() => {
                                        if (!isActive) {
                                            setIsEditing(false);
                                            navigate(`/detalle-produccion/${item.folio || item.id}`);
                                        }
                                    }}
                                    style={isActive ? styles.tabActive : styles.tabInactive}
                                >
                                    {item.nombre_formula || `Fórmula ${item.id}`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Formulario de Cabecera */}
            <div style={styles.card}>
                <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Orden de Producción</label>
                        <p style={styles.textData}>{produccionOriginal.op}</p>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Lote (Fórmula)</label>
                        {isEditing ? (
                            <input style={styles.input} name="lote" value={formData.lote} onChange={handleInputChange} />
                        ) : (
                            <p style={styles.textData}>{produccionOriginal.lote}</p>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Peso Objetivo</label>
                        {isEditing ? (
                            <input type="number" style={styles.input} name="pesform" value={formData.pesform} onChange={handleInputChange} />
                        ) : (
                            <p style={styles.textData}>{formatNumero(produccionOriginal.pesform)} Kg</p>
                        )}
                    </div>
                </div>

                {/* Resumen (Sin cambios) */}
                <div style={{ marginTop: '20px' }} className="summary-grid">
                    <div className="summary-card">
                        <span className="summary-label">Suma de Ingredientes</span>
                        <span className="summary-value" style={{
                            color: parseFloat(sumaIngredientes.replace(/,/g, '')) !== parseFloat(formData.pesform) ? '#ffec99' : '#fff'
                        }}>
                            {sumaIngredientes} Kg
                        </span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Total Items</span>
                        <span className="summary-value">{totalItems}</span>
                    </div>
                </div>
            </div>

            {/* Tabla de Detalles (Sin cambios en lógica, solo renderiza formData) */}
            <div style={styles.card}>
                <h3 style={styles.subTitle}>Ingredientes / Pesaje</h3>
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Ingrediente</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Meta (Kg)</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Mín (Kg)</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Máx (Kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.detalles.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #444' }}>
                                    <td style={styles.td}>
                                        {item.nombre_ingrediente || `ID: ${item.iding}`}
                                    </td>
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input type="number" style={styles.inputTable} value={item.pesing} onChange={(e) => handleDetalleChange(index, 'pesing', e.target.value)} />
                                        ) : (
                                            <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>
                                                {formatNumero(item.pesing)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input type="number" style={{ ...styles.inputTable, color: '#ff8787' }} value={item.pmin} onChange={(e) => handleDetalleChange(index, 'pmin', e.target.value)} />
                                        ) : (
                                            <div style={{ textAlign: 'right', color: '#ff6b6b' }}>
                                                {formatNumero(item.pmin)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input type="number" style={{ ...styles.inputTable, color: '#69db7c' }} value={item.pmax} onChange={(e) => handleDetalleChange(index, 'pmax', e.target.value)} />
                                        ) : (
                                            <div style={{ textAlign: 'right', color: '#51cf66' }}>
                                                {formatNumero(item.pmax)}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {formData.detalles.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                                        No hay ingredientes registrados.
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

// --- ESTILOS ACTUALIZADOS ---
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#e0e0e0',
        padding: '20px 40px 40px 40px',
        fontFamily: 'Arial, sans-serif'
    },
    centerMsg: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
        backgroundColor: '#121212', color: '#fff', fontSize: '1.2rem'
    },
    centerMsgError: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
        backgroundColor: '#121212', color: '#ff6b6b', fontSize: '1.2rem'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #333', paddingBottom: '15px'
    },
    backBtn: {
        background: 'transparent', border: 'none', color: '#888', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem'
    },
    titleContainer: { flex: 1, marginLeft: '20px' },
    title: { margin: 0, fontSize: '1.8rem', fontWeight: 'bold' },
    actions: { display: 'flex', gap: '15px' },

    // ESTILOS NUEVOS PARA TABS
    tabsContainer: {
        marginBottom: '20px',
    },
    tabsRow: {
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '5px'
    },
    tabActive: {
        backgroundColor: '#4dabf7',
        color: '#fff',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '20px',
        cursor: 'default',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        boxShadow: '0 2px 4px rgba(77, 171, 247, 0.4)'
    },
    tabInactive: {
        backgroundColor: '#2d2d2d',
        color: '#888',
        border: '1px solid #444',
        padding: '8px 20px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'all 0.2s'
    },

    btnEdit: {
        display: 'none',
        backgroundColor: '#E66722FF', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    btnSave: {
        backgroundColor: '#40c057', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    btnCancel: {
        backgroundColor: '#495057', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    card: {
        backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginBottom: '25px'
    },
    formGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px'
    },
    formGroup: { marginBottom: '10px' },
    label: { display: 'block', color: '#888', fontSize: '0.9rem', marginBottom: '8px' },
    textData: { fontSize: '1.5rem', color: '#fff', margin: 0 },
    input: {
        width: '100%', padding: '12px', backgroundColor: '#2d2d2d', border: '1px solid #444',
        borderRadius: '6px', color: 'white', fontSize: '1.1rem', outline: 'none'
    },
    subTitle: {
        marginTop: 0, marginBottom: '20px', borderLeft: '4px solid #4dabf7',
        paddingLeft: '10px', color: '#fff'
    },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', color: '#e0e0e0' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #444', color: '#adb5bd' },
    td: { padding: '15px 12px' },
    inputTable: {
        width: '100%', padding: '8px', backgroundColor: '#2d2d2d', border: '1px solid #444',
        borderRadius: '4px', color: 'white', textAlign: 'right'
    }
};

export default DetalleProduccionPage;