import React, { forwardRef } from 'react';
import './styles/ReporteProduccion.css';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;


const ReporteProduccion = forwardRef(({ ingredientes = [], empresa = {}, extraData = {} }, ref) => {

    console.log(empresa)
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

            {/* ================= HEADER SIMPLE ================= */}
            <header className="header-simple">
                <div className="header-left">
                    {empresa?.Logotipo && (
                        <img
                            src={`${BASE_URL}/${empresa.Logotipo}`}
                            alt="Logo"
                            className="logo-simple"
                            onError={(e) => (e.target.style.display = 'none')}
                        />
                    )}

                    <div className="empresa-info">
                        <div className="empresa-nombre-simple">
                            {empresa?.Nombre || 'NOMBRE DE LA EMPRESA'}
                        </div>
                        <div className="empresa-rfc">
                            {empresa?.RFC || 'RFC000000XXX'}
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    <div>Impreso: {fechaImpresion}</div>
                    <div>Fecha de Orden: {fechaOrden}</div>
                </div>
            </header>

            {/* ================= CONTENIDO ================= */}
            <main className="seccion-cuerpo">

                {/* ---- Detalle ---- */}
                <div className="detalle-header">
                    <div className="detalle-titulo">Detalle</div>
                    <div className="detalle-id">
                        OP: {extraData.op || '---'}
                    </div>
                </div>

                {/* ---- Info resumen ---- */}
                <div className="info-grid-simple">
                    <div>
                        <span className="dato-label">Lote</span>
                        <span className="dato-valor">{extraData.lote || '---'}</span>
                    </div>
                    <div>
                        <span className="dato-label">Peso Total</span>
                        <span className="dato-valor">{formatNumero(extraData.pesoObjetivo)} kg</span>
                    </div>
                    <div>
                        <span className="dato-label">Estatus</span>
                        <span className="dato-valor">{getEstatusTexto(extraData.estatus)}</span>
                    </div>
                    <div>
                        <span className="dato-label">Ítems</span>
                        <span className="dato-valor">
                            {ingredientes.filter(i => i.id !== '---').length}
                        </span>
                    </div>
                </div>

                {/* ---- Tabla ---- */}
                <table className="tabla-industrial">
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>Clave</th>
                            <th style={{ width: '45%' }}>Descripción / Ingrediente</th>
                            <th style={{ width: '12%' }}>Cant. Meta (kg)</th>
                            <th style={{ width: '8%' }}>Tol. (%)</th>
                            <th style={{ width: '20%' }}>Rango (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredientes.map((ing, index) => {
                            if (ing.id === '---') {
                                return (
                                    <tr key={index} className="row-separator">
                                        <td colSpan="5">{ing.nombre}</td>
                                    </tr>
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
                                    <td className="text-center bold mono">{ing.id}</td>
                                    <td>{ing.nombre}</td>
                                    <td className="text-right bold">{formatNumero(peso)}</td>
                                    <td className="text-right">
                                        {Number(tol).toLocaleString('en-US', { maximumFractionDigits: 2 })}%
                                    </td>
                                    <td className="text-right text-small">
                                        {formatNumero(pmin)} - {formatNumero(pmax)}
                                    </td>
                                </tr>
                            );
                        })}

                        {ingredientes.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center padding-xl">
                                    -- SIN DATOS --
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ---- Observaciones ---- */}
                {/*
                <div className="observaciones-box">
                    <div className="box-title">Observaciones Generales</div>
                    <div className="box-content-lines">
                        <div className="line"></div>
                        <div className="line"></div>
                        <div className="line"></div>
                        <div className="line"></div>
                    </div>
                </div>
                */}

            </main>

            {/* ================= FOOTER ================= */}
            <footer className="seccion-pie">
                <div className="footer-meta">
                    {empresa?.Calle} {empresa?.Numero}, {empresa?.Colonia}, {empresa?.Ciudad}. C.P. {empresa?.CP}
                </div>
            </footer>
        </div>
    );

});

export default ReporteProduccion;