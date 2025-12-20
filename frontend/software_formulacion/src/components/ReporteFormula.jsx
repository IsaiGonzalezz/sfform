import React, { forwardRef } from 'react';
import './styles/Reporte.css'; 

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

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

    // --- CORRECCIÓN: Inicializamos el acumulador aquí ---
    let acumulado = 0;

    return (
        <div ref={ref} className="reporte-carta">

            {/* ================= HEADER SIMPLE ================= */}
            <header className="header-simple">
                <div className="header-left">
                    {empresa?.Logotipo && (
                        <img
                            src={`${BASE_URL}/${empresa.Logotipo}`}
                            alt="Logo"
                            className="logo-simple"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    )}

                    <div className="empresa-info">
                        <div className="empresa-nombre-simple">
                            {empresa?.Nombre || 'NOMBRE DE LA EMPRESA S.A. DE C.V.'}
                        </div>
                        <div className="empresa-rfc">
                            {empresa?.RFC || 'RFC000000XXX'}
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    {fechaActual}
                </div>
            </header>

            {/* ================= CONTENIDO ================= */}
            <main className="contenido-principal">

                {/* ---- Detalle ---- */}
                <div className="detalle-header">
                    <div className="detalle-titulo">Detalle</div>
                    <div className="detalle-id">
                        ID: {formula?.id || 'N/A'}
                    </div>
                </div>

                <div className="datos-formula">
                    <div>
                        <span className="dato-label">Nombre de Fórmula</span>
                        <span className="dato-valor">{formula?.nombre || 'Sin nombre'}</span>
                    </div>
                    <div>
                        <span className="dato-label">Peso Total Calculado</span>
                        <span className="dato-valor" style={{textAlign:'center'}}>{formatNumero(pesoTotal)} kg</span>
                    </div>
                    <div>
                        <span className="dato-label">Total de Ingredientes</span>
                        <span className="dato-valor">{totalItems}</span>
                    </div>
                </div>

                {/* ---- Título Tabla ---- */}
                <div className="tabla-titulo">
                    Composición de la Fórmula
                </div>

                {/* ---- Tabla ---- */}
                <table className="tabla-industrial">
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>Clave</th>
                            <th style={{ width: '40%' }}>Descripción</th>
                            <th style={{ width: '15%' }}>Cant. Obj. (kg)</th>
                            <th style={{ width: '15%' }}>Tolerancia (%)</th>
                            <th style={{ width: '15%' }}>Acumulado (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredientes.map((ing, index) => {
                            const peso = parseFloat(ing.peso || 0);
                            
                            // --- CORRECCIÓN: Sumamos al acumulado en cada vuelta ---
                            acumulado += peso;

                            return (
                                <tr key={index}>
                                    <td className="text-center">{ing.clave || ing.id || '---'}</td>
                                    <td>{ing.nombre}</td>
                                    <td className="text-right">{formatNumero(peso)}</td>
                                    <td className="text-center">{ing.tolerancia || 0}%</td>
                                    {/* --- CORRECCIÓN: Mostramos el acumulado --- */}
                                    <td className="text-right">{formatNumero(acumulado)}</td>
                                </tr>
                            );
                        })}

                        {ingredientes.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center padding-xl">
                                    No hay ingredientes registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </main>

            {/* ================= FOOTER ================= */}
            <footer className="footer-fijo">
                <div className="sistema-meta">
                    {empresa?.Calle} {empresa?.Colonia}, {empresa?.Ciudad} {empresa?.Estado} C.P. {empresa?.CP}
                </div>
            </footer>

        </div>
    );
});

export default ReporteFormula;