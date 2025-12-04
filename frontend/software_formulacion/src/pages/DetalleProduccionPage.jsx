import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '../context/useAuth';

// --- URL RELATIVA ---
const API_URL_PRODUCCION_REL = '/produccion/';

const DetalleProduccionPage = () => {

    const { axiosInstance } = useAuth();
    const { folio } = useParams();
    const navigate = useNavigate();

    // Estados
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Estado para almacenar la data original
    const [produccionOriginal, setProduccionOriginal] = useState(null);

    // Estado para manejar los cambios del formulario
    const [formData, setFormData] = useState({
        op: '',
        lote: '',
        pesform: 0,
        detalles: [] 
    });

    // 1. GET: Cargar la Producción
    useEffect(() => {
        const fetchProduccion = async () => {
            try {
                const response = await axiosInstance.get(`${API_URL_PRODUCCION_REL}${folio}/`);
                setProduccionOriginal(response.data);
                setFormData(response.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar la producción. Verifica la conexión.');
                setLoading(false);
            }
        };
        fetchProduccion();
    }, [folio, axiosInstance]);

    // --- FORMATEO DE NÚMEROS (Igual que en Fórmulas) ---
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
        // Usamos formatNumero para el resumen también
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
                    <p style={{ color: '#888', margin: 0 }}>Folio Interno: {produccionOriginal.folio}</p>
                </div>

                {/* BTN EDIT   *style={styles.btnEdit} */} 
                <div style={styles.actions}>
                    {!isEditing ? ( 
                        <button style={{display:'none'}} onClick={() => setIsEditing(true)}>
                            <Edit3 size={18}/> Editar Datos
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

            {/* Formulario de Cabecera */}
            <div style={styles.card}>
                <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Orden de Producción</label>
                        {isEditing ? (
                            <input style={styles.input} name="op" value={formData.op} onChange={handleInputChange} />
                        ) : (
                            <p style={styles.textData}>{produccionOriginal.op}</p>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Lote</label>
                        {isEditing ? (
                            <input style={styles.input} name="lote" value={formData.lote} onChange={handleInputChange} />
                        ) : (
                            <p style={styles.textData}>{produccionOriginal.lote}</p>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Peso Objetivo (Lote)</label>
                        {isEditing ? (
                            <input type="number" style={styles.input} name="pesform" value={formData.pesform} onChange={handleInputChange} />
                        ) : (
                            <p style={styles.textData}>{formatNumero(produccionOriginal.pesform)} Kg</p>
                        )}
                    </div>
                </div>

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

            {/* Tabla de Detalles */}
            <div style={styles.card}>
                <h3 style={styles.subTitle}>Ingredientes / Pesaje</h3>
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Ingrediente</th>
                                <th style={{...styles.th, textAlign: 'right'}}>Meta (Kg)</th>
                                <th style={{...styles.th, textAlign: 'right'}}>Mín (Kg)</th>
                                <th style={{...styles.th, textAlign: 'right'}}>Máx (Kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.detalles.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #444' }}>
                                    <td style={styles.td}>
                                        {item.nombre_ingrediente || `ID: ${item.iding}`}
                                    </td>

                                    {/* PESO META */}
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input type="number" style={styles.inputTable} value={item.pesing} onChange={(e) => handleDetalleChange(index, 'pesing', e.target.value)} />
                                        ) : (
                                            <div style={{textAlign: 'right', fontWeight: 'bold', color: '#fff'}}>
                                                {formatNumero(item.pesing)}
                                            </div>
                                        )}
                                    </td>

                                    {/* PESO MÍNIMO */}
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input type="number" style={{...styles.inputTable, color: '#ff8787'}} value={item.pmin} onChange={(e) => handleDetalleChange(index, 'pmin', e.target.value)} />
                                        ) : (
                                            <div style={{textAlign: 'right', color: '#ff6b6b'}}>
                                                {formatNumero(item.pmin)}
                                            </div>
                                        )}
                                    </td>

                                    {/* PESO MÁXIMO */}
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input type="number" style={{...styles.inputTable, color: '#69db7c'}} value={item.pmax} onChange={(e) => handleDetalleChange(index, 'pmax', e.target.value)} />
                                        ) : (
                                            <div style={{textAlign: 'right', color: '#51cf66'}}>
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

// --- ESTILOS ---
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#e0e0e0',
        padding: '20px 40px 40px 40px', // CAMBIO: Menos padding arriba (20px)
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
        marginBottom: '20px', // Reducido un poco también
        borderBottom: '1px solid #333', paddingBottom: '15px'
    },
    backBtn: {
        background: 'transparent', border: 'none', color: '#888', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem'
    },
    titleContainer: { flex: 1, marginLeft: '20px' },
    title: { margin: 0, fontSize: '1.8rem', fontWeight: 'bold' },
    actions: { display: 'flex', gap: '15px' },
    btnEdit: {
        backgroundColor: '#E66722FF', color: 'white', border: 'none', padding: '10px 20px',
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