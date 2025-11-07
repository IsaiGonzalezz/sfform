import React, { forwardRef } from 'react';

const ReporteFormula = forwardRef(({ formula, ingredientes = [], empresa = {} }, ref) => {

    const fechaActual = new Date().toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let acumulado = 0;
    const pesoTotal = ingredientes.reduce((total, ing) => total + parseFloat(ing.peso || 0), 0);

    return (
        <div ref={ref} className="reporte-a4">

            {/* ENCABEZADO */}
            <header className="encabezado">
                
                {/* Izquierda: Logo y empresa */}
                <div className="encab-left">
                    {empresa?.logotipo && (
                        <img
                            src={empresa.logotipo}
                            alt="Logotipo"
                            className="logo-empresa"
                            onError={(e) => (e.target.style.display = "none")}
                        />
                    )}
                    <h1 className="empresa-nombre">{empresa?.nombre || 'Nombre de la Empresa'}</h1>
                </div>

                {/* Derecha: Folio y Fecha */}
                <div className="encab-right">
                    <p className="folio"><strong>FOLIO:</strong> {formula?.folio || 'N/A'}</p>
                    <p className="fecha"><strong>Fecha:</strong> {fechaActual}</p>
                </div>
            </header>

            {/* SUBTITULO Y ID */}
            <div className="titulo-formula">
                <h2>DETALLE DE FÓRMULA</h2>
                <span className="formula-id">ID: {formula?.id || 'N/A'}</span>
            </div>


            {/* INFORMACIÓN GENERAL */}
            <section className="info-general">
                <div className="info-item">
                    <label>Nombre de Fórmula</label>
                    <span>{formula?.nombre}</span>
                </div>

                <div className="info-item">
                    <label>Peso Total Calculado</label>
                    <span>{pesoTotal.toFixed(3)} kg</span>
                </div>

                <div className="info-item">
                    <label>Total de Ingredientes</label>
                    <span>{ingredientes.length}</span>
                </div>
            </section>

            {/* TABLA */}
            <section className="tabla-section">
                <h3>Composición de la Fórmula</h3>

                <table className="tabla-formula">
                    <thead>
                        <tr>
                            <th>Clave</th>
                            <th>Descripción</th>
                            <th>Cant. Obj. (kg)</th>
                            <th>Tolerancia (%)</th>
                            <th>Acumulado (kg)</th>
                        </tr>
                    </thead>

                    <tbody>
                        {ingredientes.map((ing) => {
                            acumulado += parseFloat(ing.peso || 0);
                            return (
                                <tr key={ing.id}>
                                    <td>{ing.id}</td>
                                    <td>{ing.nombre}</td>
                                    <td className="num">{parseFloat(ing.peso || 0).toFixed(3)}</td>
                                    <td className="num">{ing.tolerancia}</td>
                                    <td className="num">{acumulado.toFixed(3)}</td>
                                </tr>
                            );
                        })}
                    </tbody>

                    <tfoot>
                        <tr>
                            <td colSpan="2" className="total-label">TOTAL</td>
                            <td className="num total-value">{pesoTotal.toFixed(3)} kg</td>
                            <td colSpan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            {/* PIE DE PÁGINA */}
            <footer className="pie">
                <p>
                    {empresa?.calle || ''} {empresa?.colonia || ''}, 
                    {empresa?.ciudad || ''}, {empresa?.estado || ''} C.P. {empresa?.cp || ''}
                </p>
                <p>
                    Tel: {empresa?.telefono || ''} — {empresa?.correo || ''}
                </p>
            </footer>

        </div>
    );
});

export default ReporteFormula;
