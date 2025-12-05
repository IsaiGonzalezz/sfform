import React, { forwardRef } from 'react';
import './styles/ReporteProduccion.css';

const ReporteProduccion = forwardRef(({ ingredientes = [], empresa = {}, extraData = {} }, ref) => {

    const fechaImpresion = new Date().toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const fechaOrden = extraData.fecha ? new Date(extraData.fecha).toLocaleDateString('es-MX') : 'N/A';

    const formatNumero = (num) => {
        const numeroLimpo = parseFloat(num || 0);
        return isNaN(numeroLimpo) ? '0.00' : numeroLimpo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    };

    const getEstatusTexto = (st) => {
        if (st === 1) return 'ABIERTA / EN PROCESO';
        if (st === 2) return 'CERRADA / FINALIZADA';
        return 'EN VALIDACIÓN / PRE-ALTA';
    };

    return (
        <div ref={ref} className="reporte-industrial">

            {/* --- 1. BLOQUE SUPERIOR (FIJO EN IMPRESIÓN) --- */}
            <div className="seccion-encabezado">
                <header className="header-box">
                    <div className="header-logo">
                        {empresa?.logotipo && (
                            <img src={empresa.logotipo} alt="Logo" onError={(e) => (e.target.style.display = "none")} />
                        )}
                    </div>
                    <div className="header-titles">
                        <h1 className="company-name">{empresa?.nombre || 'NOMBRE DE LA EMPRESA'}</h1>
                        <h2 className="doc-title">ORDEN DE PRODUCCIÓN</h2>
                    </div>
                    <div className="header-meta">
                        <div className="meta-row"><span className="meta-label">FOLIO OP:</span><span className="meta-value highlight">{extraData.op || '---'}</span></div>
                        <div className="meta-row"><span className="meta-label">FECHA:</span><span className="meta-value">{fechaOrden}</span></div>
                        <div className="meta-row"><span className="meta-label">IMPRESIÓN:</span><span className="meta-value" style={{ fontSize: '6pt' }}>{fechaImpresion}</span></div>
                    </div>
                </header>

                <section className="info-grid">
                    <div className="info-cell"><span className="cell-label">LOTE</span><span className="cell-value">{extraData.lote || '---'}</span></div>
                    <div className="info-cell"><span className="cell-label">PESO TOTAL</span><span className="cell-value">{formatNumero(extraData.pesoObjetivo)} kg</span></div>
                    <div className="info-cell"><span className="cell-label">ESTATUS</span><span className="cell-value">{getEstatusTexto(extraData.estatus)}</span></div>
                    <div className="info-cell"><span className="cell-label">ÍTEMS</span><span className="cell-value">{ingredientes.filter(i => i.id !== '---').length}</span></div>
                </section>
            </div>

            {/* --- 2. BLOQUE CENTRAL (FLUIDO CON MÁRGENES) --- */}
            <div className="seccion-cuerpo">
                <table className="tabla-industrial">
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>CLAVE</th>
                            <th style={{ width: '45%' }}>DESCRIPCIÓN / INGREDIENTE</th>
                            <th style={{ width: '12%' }}>CANT. META (KG)</th>
                            <th style={{ width: '8%' }}>TOL. (%)</th>
                            <th style={{ width: '15%' }}>RANGO (KG)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredientes.map((ing, index) => {
                            if (ing.id === '---') {
                                return (
                                    <tr key={index} className="row-separator"><td colSpan="5">{ing.nombre}</td></tr>
                                );
                            }

                            const peso = parseFloat(ing.peso || 0);
                            let tol = parseFloat(ing.tolerancia || 0);
                            const pmaxRaw = parseFloat(ing.pmax || 0);

                            if (tol === 0 && pmaxRaw > 0 && peso > 0) {
                                tol = ((pmaxRaw - peso) / peso) * 100;
                            }

                            const pmin = ing.pmin ? ing.pmin : (peso - (peso * (tol / 100)));
                            const pmax = ing.pmax ? ing.pmax : (peso + (peso * (tol / 100)));

                            return (
                                <tr key={index}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold', textAlign: 'center' }}>{ing.id}</td>
                                    <td>{ing.nombre}</td>
                                    <td className="num-cell" style={{ fontWeight: 'bold' }}>{formatNumero(peso)}</td>
                                    <td className="num-cell">{Number(tol).toLocaleString('en-US', { maximumFractionDigits: 2 })}%</td>
                                    <td className="num-cell" style={{ fontSize: '8pt' }}>
                                        {formatNumero(pmin)} - {formatNumero(pmax)}
                                    </td>
                                </tr>
                            );
                        })}
                        {ingredientes.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>-- SIN DATOS --</td></tr>}
                    </tbody>
                </table>
                <div className="observaciones-box">
                    <div className="box-title">OBSERVACIONES GENERALES:</div>
                    <div className="box-content-lines">
                        <div className="line"></div>
                        <div className="line"></div>
                        <div className="line"></div>
                        <div className="line"></div>
                    </div>
                </div>
            </div>

            {/* --- 3. BLOQUE INFERIOR (FIJO EN IMPRESIÓN) --- */}
            <footer className="seccion-pie">

                {/*  POR SI SE OCUPAN FIRMAS
                <div className="firmas-grid">
                    <div className="firma-box"><div className="firma-line"></div><span className="firma-label">PROGRAMÓ / AUTORIZÓ</span></div>
                    <div className="firma-box"><div className="firma-line"></div><span className="firma-label">OPERADOR RESPONSABLE</span></div>
                    <div className="firma-box"><div className="firma-line"></div><span className="firma-label">VERIFICACIÓN CALIDAD</span></div>
                </div>
                */}

                <div className="footer-meta">
                    {empresa?.calle} {empresa?.numero},{empresa?.colonia},{empresa?.ciudad}. C.P.: {empresa?.cp}
                </div>
            </footer>
        </div>
    );
});

export default ReporteProduccion;