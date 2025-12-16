import React, { forwardRef } from 'react';

// URL BASE DEL BACKEND
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const ReporteInventario = forwardRef(({ data, rangoFechas, usuario, empresa }, ref) => {
    
    const emp = empresa || {};

    const styles = {
        // Contenedor principal: Usamos Flexbox para empujar el footer al final
        container: { 
            fontFamily: 'Arial, sans-serif', 
            padding: '30px', 
            backgroundColor: '#fff',
            width: '100%',
            // Ajustamos altura mínima para simular hoja carta horizontal (Landscape)
            // Carta Landscape es aprox 216mm de alto. Restamos márgenes.
            minHeight: '185mm', 
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box' 
        },
        
        // Contenedor de contenido (Header + Tabla) que crece
        contentWrapper: {
            flex: 1
        },

        // --- HEADER ---
        headerContainer: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '15px', 
            borderBottom: '3px solid #3CA7FF', 
            paddingBottom: '10px' 
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
        },
        logoBox: { 
            width: '60px', 
            height: '60px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
        },
        logoImg: { 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain' 
        },
        companyTitle: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            textTransform: 'uppercase'
        },
        reportTitle: {
            fontSize: '12px',
            color: '#3CA7FF',
            fontWeight: 'bold',
            marginTop: '2px',
            letterSpacing: '1px'
        },

        // Datos del reporte (Derecha)
        reportMeta: {
            textAlign: 'right',
            fontSize: '10px',
            color: '#555',
            lineHeight: '1.4'
        },

        // --- TABLA ---
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '9px' },
        th: { backgroundColor: '#f0f7ff', borderBottom: '2px solid #3CA7FF', padding: '6px', textAlign: 'left', fontWeight: 'bold', color: '#1565c0' },
        td: { borderBottom: '1px solid #eee', padding: '5px', color: '#333' },
        
        // --- TOTALES ---
        totalBox: { 
            marginTop: '15px', 
            textAlign: 'right', 
            fontSize: '11px', 
            fontWeight: 'bold', 
            padding: '8px', 
            backgroundColor: '#f9f9f9', 
            border: '1px solid #eee' 
        },
        
        // --- FOOTER ---
        footer: {
            marginTop: 'auto', // Esto empuja el footer hasta el final del contenedor
            paddingTop: '10px',
            borderTop: '1px solid #ccc',
            textAlign: 'center',
            fontSize: '7px', // Letra chica como pediste
            color: '#777',
            width: '100%'
        },

        statusBadge: (estatus) => ({
            padding: '2px 5px',
            borderRadius: '4px',
            fontSize: '8px',
            fontWeight: 'bold',
            backgroundColor: estatus === 1 ? '#fff3e0' : '#e8f5e9',
            color: estatus === 1 ? '#e65100' : '#2e7d32',
            display: 'inline-block',
            border: estatus === 1 ? '1px solid #ffcc80' : '1px solid #a5d6a7'
        })
    };

    const formatearFecha = (fechaISO) => {
        if(!fechaISO) return '-';
        return new Date(fechaISO).toLocaleDateString('es-MX') + ' ' + new Date(fechaISO).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});
    };

    return (
        <div ref={ref} style={styles.container}>
            
            {/* WRAPPER DE CONTENIDO (Para empujar el footer) */}
            <div style={styles.contentWrapper}>
                
                {/* ENCABEZADO */}
                <div style={styles.headerContainer}>
                    <div style={styles.headerLeft}>
                        {emp.Logotipo && (
                            <div style={styles.logoBox}>
                                {/* Usamos BASE_URL + Logotipo */}
                                <img src={`${BASE_URL}/${emp.Logotipo}`} alt="Logo" style={styles.logoImg} />
                            </div>
                        )}
                        <div>
                            <div style={styles.companyTitle}>{emp.Nombre || 'NOMBRE DE EMPRESA'}</div>
                            <div style={styles.reportTitle}>REPORTE DE INVENTARIO</div>
                        </div>
                    </div>

                    <div style={styles.reportMeta}>
                        <div><strong>Generado:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Rango:</strong> {rangoFechas.desde} al {rangoFechas.hasta}</div>
                        {usuario && <div><strong>Usuario:</strong> {usuario}</div>}
                        <div>Total Registros: {data.length}</div>
                    </div>
                </div>

                {/* TABLA */}
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>OP</th>
                            <th style={styles.th}>Lote</th>
                            <th style={styles.th}>Fórmula</th>
                            <th style={styles.th}>Operador</th>
                            <th style={styles.th}>Fecha</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Peso Obj</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Peso Real</th>
                            <th style={{...styles.th, textAlign: 'center'}}>Estatus</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No hay datos para mostrar en este rango.</td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr key={index}>
                                    <td style={styles.td}><strong>{row.op || 'S/N'}</strong></td>
                                    <td style={styles.td}>{row.lote || '-'}</td>
                                    <td style={styles.td}>{row.nombre_formula}</td>
                                    <td style={styles.td}>{row.nombre_usuario || 'Sistema'}</td>
                                    <td style={styles.td}>{formatearFecha(row.fecha)}</td>
                                    <td style={{...styles.td, textAlign: 'right'}}>{row.p_obj} kg</td>
                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>{row.p_real ? parseFloat(row.p_real).toFixed(2) : '0.00'} kg</td>
                                    <td style={{...styles.td, textAlign: 'center'}}>
                                        <span style={styles.statusBadge(row.estatus)}>
                                            {row.estatus === 1 ? 'PENDIENTE' : 'CERRADA'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* TOTALES */}
                <div style={styles.totalBox}>
                    Peso Total Procesado: {data.reduce((acc, curr) => acc + (parseFloat(curr.p_real) || 0), 0).toFixed(2)} kg
                </div>
            </div>

            {/* FOOTER - AL FONDO Y EN UNA SOLA LÍNEA */}
            {empresa && (
                <div style={styles.footer}>
                    {/* Construimos la línea de dirección */}
                    <span>
                        {emp.Calle ? emp.Calle.toUpperCase() : ''}
                        {emp.Colonia ? `, COL. ${emp.Colonia.toUpperCase()}` : ''}
                        {emp.Ciudad ? `, ${emp.Ciudad.toUpperCase()}` : ''}
                        {emp.Estado ? `, ${emp.Estado.toUpperCase()}` : ''}
                        {emp.CP ? `. CP: ${emp.CP}` : ''}
                    </span>
                    
                    {/* Separador */}
                    <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>

                    {/* Datos de contacto */}
                    <span>
                        <strong>RFC:</strong> {emp.RFC || '-'} &nbsp;
                        <strong>TEL:</strong> {emp.Telefono || '-'} &nbsp;
                        <strong>EMAIL:</strong> {emp.Correo || '-'}
                    </span>
                </div>
            )}
        </div>
    );
});

export default ReporteInventario;