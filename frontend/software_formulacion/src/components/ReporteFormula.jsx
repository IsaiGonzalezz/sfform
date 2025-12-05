import React, { forwardRef } from 'react';
import './styles/Reporte.css'; // Asegúrate de importar el nuevo CSS

const ReporteFormula = forwardRef(({ formula, ingredientes = [], empresa = {} }, ref) => {

    const fechaActual = new Date().toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // Cálculos Generales
    const pesoTotal = ingredientes.reduce((total, ing) => total + parseFloat(ing.peso || 0), 0);
    const totalItems = ingredientes.length;

    // Formateador de moneda/números
    const formatNumero = (num) => {
        return parseFloat(num || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 3
        });
    };

    return (
        <div ref={ref} className="reporte-carta">
            
            {/* --- 1. ENCABEZADO "TIPO CUADRO" --- */}
            <header className="header-fijo">
                <div className="header-grid">
                    {/* Columna 1: Logo */}
                    <div className="header-col logo-col">
                        {empresa?.logotipo && (
                            <img src={empresa.logotipo} alt="Logo" className="img-logo" onError={(e) => e.target.style.display='none'}/>
                        )}
                    </div>

                    {/* Columna 2: Datos Empresa y Título */}
                    <div className="header-col title-col">
                        <h3 className="empresa-nombre">{empresa?.nombre || 'NOMBRE DE LA EMPRESA S.A. DE C.V.'}</h3>
                        <h1 className="doc-titulo">REPORTE DE FÓRMULA</h1>
                    </div>

                    {/* Columna 3: Metadatos (Folio, Fecha) */}
                    <div className="header-col meta-col">
                        <div className="meta-row border-bottom">
                            <span className="meta-label">ID FÓRMULA:</span>
                            <span className="meta-value text-red">{formula?.id || 'N/A'}</span>
                        </div>
                        <div className="meta-row border-bottom">
                            <span className="meta-label">IMPRESIÓN:</span>
                            <span className="meta-value">{fechaActual}</span>
                        </div>
                    </div>
                </div>

                {/* BARRA DE INFORMACIÓN (La tira gris debajo del header) */}
                <div className="summary-strip">
                    <div className="sum-item border-right">
                        <span className="sum-label">NOMBRE DE FÓRMULA</span>
                        <span className="sum-value">{formula?.nombre || 'Sin Nombre'}</span>
                    </div>
                    <div className="sum-item border-right">
                        <span className="sum-label">PESO TOTAL</span>
                        <span className="sum-value">{formatNumero(pesoTotal)} kg</span>
                    </div>
                    <div className="sum-item">
                        <span className="sum-label">TOTAL ÍTEMS</span>
                        <span className="sum-value">{totalItems}</span>
                    </div>
                </div>
            </header>

            {/* --- 2. CONTENIDO (TABLA) --- */}
            <main className="contenido-principal">
                <table className="tabla-industrial">
                    <thead>
                        <tr>
                            <th style={{width: '15%'}}>CLAVE / ID</th>
                            <th style={{width: '40%'}}>DESCRIPCIÓN / INGREDIENTE</th>
                            <th style={{width: '15%'}}>CANT. META (KG)</th>
                            <th style={{width: '10%'}}>TOL. (%)</th>
                            <th style={{width: '20%'}}>RANGO (KG)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredientes.map((ing, index) => {
                            const peso = parseFloat(ing.peso || 0);
                            const tol = parseFloat(ing.tolerancia || 0);
                            const min = peso - (peso * (tol / 100));
                            const max = peso + (peso * (tol / 100));

                            return (
                                <tr key={index}>
                                    <td className="text-center bold">{ing.clave || ing.id || '---'}</td>
                                    <td>{ing.nombre}</td>
                                    <td className="text-right bold">{formatNumero(peso)}</td>
                                    <td className="text-center">{tol}%</td>
                                    <td className="text-right text-small">
                                        {formatNumero(min)} - {formatNumero(max)}
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Fila de relleno si no hay datos */}
                        {ingredientes.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center padding-xl">No hay ingredientes cargados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="observaciones-container">
                    <div className="obs-header">OBSERVACIONES GENERALES:</div>
                    <div className="obs-lines">
                        <div className="line"></div>
                        <div className="line"></div>
                        <div className="line"></div>
                    </div>
                </div>
            </main>

            {/* --- 3. PIE DE PÁGINA (OBSERVACIONES) --- */}
            <footer className="footer-fijo">
                <div className="sistema-meta">
                    
                            {empresa?.calle} {empresa?.colonia}, {empresa?.ciudad} {empresa?.estado} C.P.: {empresa?.cp}
                        
                </div>
            </footer>

        </div>
    );
});

export default ReporteFormula;