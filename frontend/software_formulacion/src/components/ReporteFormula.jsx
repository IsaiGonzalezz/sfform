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

    // --- ¡LA FUNCIÓN BUENA! ---
    const formatNumero = (num) => {
        const numeroLimpo = parseFloat(num || 0);
        
        // Formatea el número usando el estándar 'en-US' (o 'es-MX'):
        // - Usa ',' para miles (ej: 1,000)
        // - Usa '.' para decimales (ej: 12.5)
        // - MÁXIMO 3 decimales (no los fuerza si no existen)
        return numeroLimpo.toLocaleString('en-US', {
            maximumFractionDigits: 3 
        });
    };
    // ----------------------------

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
                    <div className="info-empresa">
                        <h2 className="empresa-nombre">{empresa?.nombre || 'Nombre de la Empresa'}</h2>
                        <h5 className="empresa-rfc"> {empresa?.rfc || 'RFC'} </h5>
                    </div>
                </div>

                {/* Derecha: Folio y Fecha */}
                <div className="encab-right">
                    <p className="fecha"><strong></strong> {fechaActual}</p>
                </div>
            </header>
            <main className='contenido-principal'>
                {/* SUBTITULO Y ID */}
                <div className="titulo-formula">
                    <h5>Detalle</h5>
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
                        {/* --- CAMBIO 1 --- */}
                        <span style={{textAlign:'center'}}>{formatNumero(pesoTotal)} kg</span>
                    </div>

                    <div className="info-item">
                        <label>Total de Ingredientes</label>
                        <span style={{textAlign:'center'}}>{ingredientes.length}</span>
                    </div>
                </section>

                {/* TABLA */}
                <section className="tabla-section">
                    <h5>Composición de la Fórmula</h5>

                    <table className="tabla-formula">
                        <thead>
                            <tr>
                                <th>Clave</th>
                                <th>Descripción</th>
                                <th style={{textAlign: 'right'}}>Cant. Obj. (kg)</th>
                                <th style={{textAlign: 'right'}}>Tolerancia (%)</th>
                                <th style={{textAlign: 'right'}}>Acumulado (kg)</th>
                            </tr>
                        </thead>

                        <tbody>
                            {ingredientes.map((ing) => {
                                acumulado += parseFloat(ing.peso || 0);
                                return (
                                    <tr key={ing.id}>
                                        <td>{ing.id}</td>
                                        <td>{ing.nombre}</td>
                                        
                                        {/* --- CAMBIO 2 --- */}
                                        <td className="num">{formatNumero(ing.peso)}</td>
                                        
                                        <td className="num">{ing.tolerancia}</td>
                                        
                                        {/* --- CAMBIO 3 --- */}
                                        <td className="num">{formatNumero(acumulado)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        
                    </table>
                </section>
            </main>
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