import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Edit3, Layers, Trash2, Check, AlertCircle, Loader } from 'lucide-react'; 
import { useAuth } from '../context/useAuth';

const API_URL_PRODUCCION_REL = '/produccion/';

const DetalleProduccionPage = () => {

    const { axiosInstance } = useAuth();
    const { folio } = useParams(); 
    const navigate = useNavigate();

    // Estados
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // --- NUEVO: Estado de carga para acciones (Guardar/Eliminar) ---
    const [isSaving, setIsSaving] = useState(false);

    // Estado para almacenar la data original
    const [produccionOriginal, setProduccionOriginal] = useState(null);

    // Estado para las pestañas
    const [formulasHermanas, setFormulasHermanas] = useState([]);

    // Estado del formulario
    const [formData, setFormData] = useState({
        id: '', 
        op: '',
        lote: '',
        pesform: 0,
        detalles: []
    });

    // --- NUEVO: Estados para UI (Toast y Modal) ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // --- HELPER: Mostrar Toast ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // 1. GET: Cargar la Producción
    useEffect(() => {
        const fetchProduccion = async () => {
            setLoading(true); 
            try {
                const response = await axiosInstance.get(`${API_URL_PRODUCCION_REL}${folio}/`);
                const dataActual = response.data;

                setProduccionOriginal(dataActual);
                setFormData(dataActual);

                // Buscar hermanos
                if (dataActual.op) {
                    try {
                        const searchRes = await axiosInstance.get(`${API_URL_PRODUCCION_REL}?search=${dataActual.op}`);
                        const hermanos = searchRes.data.filter(f => f.op === dataActual.op);
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
    }, [folio, axiosInstance]);

    const formatNumero = (num) => {
        const numeroLimpo = parseFloat(num || 0);
        return numeroLimpo.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const [sumaIngredientes, totalItems] = useMemo(() => {
        const detalles = formData.detalles || [];
        const total = detalles.reduce((sum, d) => sum + parseFloat(d.pesing || 0), 0);
        const count = detalles.length;
        return [formatNumero(total), count];
    }, [formData.detalles]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDetalleChange = (index, field, value) => {
        const nuevosDetalles = [...formData.detalles];
        nuevosDetalles[index][field] = value;
        setFormData({ ...formData, detalles: nuevosDetalles });
    };

    // 2. PATCH: Guardar Cambios (Actualizado con Toast/Loader)
    const handleSave = async () => {
        setIsSaving(true); // Bloqueo botón
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

            showToast('Producción actualizada correctamente'); // Toast éxito
            setIsEditing(false);
            setProduccionOriginal(formData);

        } catch (err) {
            console.error(err);
            showToast('Error al actualizar. Revisa la consola.', 'error'); // Toast error
        } finally {
            setIsSaving(false); // Desbloqueo botón
        }
    };

    // 3. DELETE: Solicitar eliminación (Abre Modal)
    const handleDeleteRequest = () => {
        setShowConfirmModal(true);
    };

    // 4. DELETE: Ejecutar eliminación (Tras confirmar)
    const executeDelete = async () => {
        setShowConfirmModal(false); // Cerramos modal
        setIsSaving(true); // Bloqueamos UI
        
        try {
            // Asumiendo que API_URL_PRODUCCION_REL termina en '/' (ej: '/api/produccion/')
            await axiosInstance.delete(`${API_URL_PRODUCCION_REL}${formData.op}`);
            
            showToast(`Orden ${formData.op} eliminada exitosamente.`);
            
            setTimeout(() => {
                navigate('/produccion');
            }, 1500);

        } catch (err) {
            console.error(err);
            setIsSaving(false); // Desbloqueamos
            // Si el backend nos responde (ej. 403 Prohibido o 404 No Encontrado)
            if (err.response && err.response.data && err.response.data.message) {
                // Mostramos EL MENSAJE DEL BACKEND (Ej: "No se puede eliminar: La orden está activa...")
                showToast(err.response.data.message, 'error');
            } else {
                // Error genérico de conexión
                showToast('Error al intentar eliminar la OP.', 'error');
            }
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

    const pestañasOrdenadas = [...formulasHermanas].sort((a, b) => a.id - b.id);

    return (
        <div style={styles.container}>
            
            {/* --- TOAST --- */}
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

            {/* --- MODAL CONFIRMACIÓN --- */}
            {showConfirmModal && (
                <div style={customStyles.modalOverlay}>
                    <div style={customStyles.iosModal}>
                        <div style={customStyles.iosModalContent}>
                            <h3 style={customStyles.iosTitle}>Confirmar Eliminación</h3>
                            <p style={customStyles.iosMessage}>
                                ¿Estás seguro de borrar TODA la orden <strong>{formData.op}</strong>? 
                                <br/>Esta acción <strong>NO</strong> se puede deshacer.
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
                                style={{ ...customStyles.iosButtonConfirm, color: '#ef4444' }} // Rojo para acción destructiva
                                onClick={executeDelete}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        <>
                            {/* BOTÓN ELIMINAR ACTUALIZADO */}
                            <button 
                                style={{ 
                                    ...styles.btnDelete, 
                                    opacity: isSaving ? 0.7 : 1, 
                                    cursor: isSaving ? 'not-allowed' : 'pointer' 
                                }} 
                                onClick={handleDeleteRequest}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader size={18} className="spin-animation" /> : <Trash2 size={18} />}
                                {isSaving ? ' Eliminando...' : ' Eliminar'}
                            </button>

                            <button style={styles.btnEdit} onClick={() => setIsEditing(true)} disabled={isSaving}>
                                <Edit3 size={18} /> Editar
                            </button>
                        </>
                    ) : (
                        <>
                            <button style={styles.btnCancel} onClick={handleCancel} disabled={isSaving}>
                                <X size={18} /> Cancelar
                            </button>
                            {/* BOTÓN GUARDAR ACTUALIZADO */}
                            <button 
                                style={{ 
                                    ...styles.btnSave,
                                    opacity: isSaving ? 0.7 : 1, 
                                    cursor: isSaving ? 'not-allowed' : 'pointer'
                                }} 
                                onClick={handleSave} 
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader size={18} className="spin-animation" /> : <Save size={18} />}
                                {isSaving ? ' Guardando...' : ' Guardar'}
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
                        {pestañasOrdenadas.map((item, i) => {
                            const isActive = String(item.id) === String(folio) || String(item.folio) === String(folio);
                            const uniqueKey = item.id || item.folio || i;

                            return (
                                <button
                                    key={uniqueKey}
                                    onClick={() => {
                                        if (!isActive) {
                                            setIsEditing(false);
                                            navigate(`/detalle-produccion/${item.folio || item.id}`);
                                        }
                                    }}
                                    disabled={isSaving} // Bloqueamos navegación si está guardando/eliminando
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
                            <input style={styles.input} name="lote" value={formData.lote} onChange={handleInputChange} disabled={isSaving} />
                        ) : (
                            <p style={styles.textData}>{produccionOriginal.lote}</p>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Peso Objetivo</label>
                        {isEditing ? (
                            <input type="number" style={styles.input} name="pesform" value={formData.pesform} onChange={handleInputChange} disabled={isSaving} />
                        ) : (
                            <p style={styles.textData}>{formatNumero(produccionOriginal.pesform)} Kg</p>
                        )}
                    </div>
                </div>

                {/* Resumen */}
                <div style={{ marginTop: '20px' }} className="summary-grid">
                    <div className="summary-card">
                        <span className="summary-label">Suma de Ingredientes</span>
                        <span className="summary-value" style={{
                            color: parseFloat(sumaIngredientes.replace(/,/g, '')) !== parseFloat(formData.pesform) ? '#ffec99' : 'var(--text-color)'
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
                                <th style={styles.thRight}>Meta (Kg)</th>
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
                                            <input type="number" style={styles.inputTable} value={item.pesing} onChange={(e) => handleDetalleChange(index, 'pesing', e.target.value)} disabled={isSaving} />
                                        ) : (
                                            <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-color)' }}>
                                                {formatNumero(item.pesing)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input type="number" style={{ ...styles.inputTable, color: '#ff8787' }} value={item.pmin} onChange={(e) => handleDetalleChange(index, 'pmin', e.target.value)} disabled={isSaving} />
                                        ) : (
                                            <div style={{ textAlign: 'right', color: '#ff6b6b' }}>
                                                {formatNumero(item.pmin)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {isEditing ? (
                                            <input type="number" style={{ ...styles.inputTable, color: '#69db7c' }} value={item.pmax} onChange={(e) => handleDetalleChange(index, 'pmax', e.target.value)} disabled={isSaving} />
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
            
            {/* Animación del Loader */}
            <style>{`
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

// --- ESTILOS PERSONALIZADOS (TOAST & MODAL) ---
const customStyles = {
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
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
        color: 'var(--text-color)', // Adaptable
        opacity: 0.7,
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
    },
    iosButtonConfirm: {
        flex: 1,
        padding: '16px',
        background: 'transparent',
        border: 'none',
        fontWeight: '700',
        fontSize: '1rem',
        cursor: 'pointer',
    }
};

// --- ESTILOS PRINCIPALES ---
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        padding: '20px 40px 40px 40px',
        fontFamily: 'Arial, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        position: 'relative' // Necesario para el overlay
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
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '15px'
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-color)',
        opacity: 0.6,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem',
        transition: 'opacity 0.2s'
    },
    titleContainer: { flex: 1, marginLeft: '20px' },
    title: {
        margin: 0,
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: 'var(--text-color)'
    },
    actions: { display: 'flex', gap: '15px' },

    // --- TABS ---
    tabsContainer: { marginBottom: '20px' },
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
        backgroundColor: 'transparent',
        color: 'var(--text-color)',
        opacity: 0.6,
        border: '1px solid var(--border-color)',
        padding: '8px 20px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'all 0.2s'
    },

    // --- BOTONES ---
    btnDelete: {
        backgroundColor: '#FF0000FF', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display:'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    btnEdit: {
        backgroundColor: '#E66722FF', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display:'none', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    btnSave: {
        backgroundColor: '#40c057', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },
    btnCancel: {
        backgroundColor: '#495057', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'
    },

    // --- CARD Y FORMULARIO ---
    card: {
        backgroundColor: 'var(--card-bg)',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '25px',
        transition: 'background-color 0.3s ease'
    },
    formGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px'
    },
    formGroup: { marginBottom: '10px' },
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

    // --- TABLA ---
    tableContainer: { overflowX: 'auto' },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        color: 'var(--text-color)'
    },
    thRight: {
        textAlign: 'right',
        padding: '12px',
        borderBottom: '2px solid var(--border-color)',
        color: 'var(--text-color)',
        opacity: 0.8,
        fontWeight: 'bold'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '2px solid var(--border-color)',
        color: 'var(--text-color)',
        opacity: 0.8
    },
    td: { padding: '15px 12px' },
    inputTable: {
        width: '100%',
        padding: '8px',
        backgroundColor: 'var(--bg-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        color: 'var(--text-color)',
        textAlign: 'right'
    }
};

export default DetalleProduccionPage;