import React, {useEffect, useState} from 'react';
import { useAuth } from '../context/useAuth'; // Corregida la tipografía: 'useAuth'
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar
} from 'recharts';
import './styles/Dashboard.css';


// Definición de colores estática para el PieChart
const PIE_COLORS = ['#00E808FF', '#FF0037FF', '#3CA7FFFF'];

export default function Dashboard() {
    
    // 1. Obtener la instancia de Axios segura del contexto
    const { axiosInstance } = useAuth();
    
    // 2. Definir estados para los datos reales de la API
    const [stats, setStats] = useState({ 
        lineData: [], 
        pieData: [], 
        barData: [], 
        statCards: { pendientes: 0, proceso: 0, completados: 0, calidad: '0%' }
    }); 
    const [loading, setLoading] = useState(true);

    // 3. Función para cargar datos al montar el componente
    useEffect(() => {
        const fetchDashboardData = async () => {
            // El Access Token se adjunta/refresca automáticamente aquí
            try {
                // Petición a tu endpoint de Django (asume que devuelve todos los datos necesarios)
                const response = await axiosInstance.get('/api/dashboard_data/'); 
                
                // 4. Procesar y establecer los datos (esto asume una estructura de respuesta específica)
                const data = response.data;

                setStats({
                    // Asume que la API te devuelve la data de las gráficas
                    lineData: data.line_data || [], 
                    pieData: data.pie_data ? data.pie_data.map((item, index) => ({
                        ...item,
                        color: PIE_COLORS[index]
                    })) : [],
                    barData: data.bar_data || [],
                    statCards: {
                        pendientes: data.stat_cards.pendientes,
                        proceso: data.stat_cards.proceso,
                        completados: data.stat_cards.completados,
                        calidad: data.stat_cards.calidad_prom
                    }
                });

                setLoading(false);
            } catch (error) {
                // El error 401 (expirado) se maneja en el Interceptor; aquí capturamos fallas reales.
                console.error("Error al cargar datos del dashboard:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    // La dependencia axiosInstance asegura que el effect se ejecute cuando el hook esté listo
    }, [axiosInstance]);

    // Mostrar un estado de carga mientras se esperan los datos
    if (loading) {
        return <div className="dashboard-loading">Cargando datos del Dashboard...</div>;
    }

    return (
        <div className="dashboard">

            {/* --- 1. FILA DE ESTADÍSTICAS DINÁMICAS --- */}
            <div className="stat-card stat-card-1">
                <h3 className="stat-title">Lotes Pendientes</h3>
                <p className="stat-number">{stats.statCards.pendientes}</p>
            </div>
            <div className="stat-card stat-card-2">
                <h3 className="stat-title">En Proceso</h3>
                <p className="stat-number">{stats.statCards.proceso}</p>
            </div>
            <div className="stat-card stat-card-3">
                <h3 className="stat-title">Completados</h3>
                <p className="stat-number">{stats.statCards.completados}</p>
            </div>
            <div className="stat-card stat-card-4">
                <h3 className="stat-title">Calidad Prom.</h3>
                <p className="stat-number">{stats.statCards.calidad}</p>
            </div>


            {/* --- 2. GRÁFICAS (Usando datos del estado) --- */}
            <div className="chart-box line-chart">
                <h2>Indicadores Mensuales</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={stats.lineData}>
                        <XAxis dataKey="name" stroke="#ccc" />
                        <YAxis stroke="#ccc" />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} />
                        <Line type="monotone" dataKey="Calidad" stroke="#00FF80FF" strokeWidth={3} dot={{ r: 5 }} />
                        <Line type="monotone" dataKey="Eficiencia" stroke="#FFA600FF" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-box pie-chart">
                <h2>Estado General</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={stats.pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            label
                        >
                            {stats.pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-box bar-chart">
                <h2>Producción por Estación</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.barData}>
                        <XAxis dataKey="name" stroke="#ccc" />
                        <YAxis stroke="#ccc" />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="Pendiente" fill="#F44336" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Producción" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}