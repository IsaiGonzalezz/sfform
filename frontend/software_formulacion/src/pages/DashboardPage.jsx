import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, CartesianGrid
} from 'recharts';
import {
    Clock,
    CheckCircle,
    Award,
    TrendingUp,
    PieChart as PieIcon,
    BarChart3,
    Loader2
} from 'lucide-react';
import './styles/Dashboard.css';

// Colores neón/vibrantes para el gráfico de pastel
const PIE_COLORS = ['#00E808', '#FF0037', '#3CA7FF', '#FFBB28', '#FF8042'];

const API_URL_DASHBOARD_REL = '/resumen/'; // Ajusta si tu ruta base es distinta

export default function Dashboard() {

    const { axiosInstance } = useAuth();

    // Estado inicial seguro
    const [stats, setStats] = useState({
        lineData: [],
        pieData: [],
        barData: [],
        kpi: { pendientes: 0, completados: 0, precision: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Petición real al backend
                const response = await axiosInstance.get(API_URL_DASHBOARD_REL);
                const data = response.data;

                // Mapeo directo de tu JSON del backend al estado
                setStats({
                    lineData: data.lineChart || [],
                    pieData: data.pieChart ? data.pieChart.map((item, index) => ({
                        ...item,
                        // Asignamos color cíclicamente
                        color: PIE_COLORS[index % PIE_COLORS.length]
                    })) : [],
                    barData: data.barChart || [],
                    kpi: {
                        pendientes: data.kpi.pendientes,
                        completados: data.kpi.completados,
                        precision: data.kpi.precision
                    }
                });

                setLoading(false);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [axiosInstance]);

    if (loading) {
        return (
            <div className="dashboard-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#888' }}>
                <Loader2 className="spin-slow" size={48} color="#3CA7FF" />
                <p style={{ marginTop: 10 }}>Cargando indicadores...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* TÍTULO CON ESTILO */}
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp color="#3CA7FF" /> Panel de Control
                </h1>
                <p style={{ color: '#666', margin: 0 }}>Vista general de producción en tiempo real</p>
            </div>

            {/* --- 1. FILA DE CARDS (KPIs) --- */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>

                {/* Card: Pendientes */}
                <div className="stat-card" style={{ borderLeft: '4px solid #FFBB28' }}>
                    <div className="stat-icon-container" style={{ background: 'rgba(255, 187, 40, 0.15)', color: '#FFBB28' }}>
                        <Clock size={24} className="pulse-icon" />
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-title">En Cola</h3>
                        <p className="stat-number">{stats.kpi.pendientes}</p>
                        <span className="stat-desc">Lotes pendientes</span>
                    </div>
                </div>

                {/* Card: Completados */}
                <div className="stat-card" style={{ borderLeft: '4px solid #00E808' }}>
                    <div className="stat-icon-container" style={{ background: 'rgba(0, 232, 8, 0.15)', color: '#00E808' }}>
                        <CheckCircle size={24} className="bounce-icon" />
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-title">Terminados</h3>
                        <p className="stat-number">{stats.kpi.completados}</p>
                        <span className="stat-desc">Este mes</span>
                    </div>
                </div>

                {/* Card: Eficiencia */}
                <div className="stat-card" style={{ borderLeft: '4px solid #3CA7FF' }}>
                    <div className="stat-icon-container" style={{ background: 'rgba(60, 167, 255, 0.15)', color: '#3CA7FF' }}>
                        {/* Cambié el icono Award por TrendingUp o Percent, pero Award funciona bien */}
                        <Award size={24} className="spin-hover" />
                    </div>
                    <div className="stat-info">
                        {/* CAMBIO AQUÍ: El título */}
                        <h3 className="stat-title">Eficiencia Global</h3>

                        {/* El dato sigue viniendo en stats.kpi.precision, pero ahora trae el % de avance */}
                        <p className="stat-number">{stats.kpi.precision}%</p>

                        {/* CAMBIO AQUÍ: La descripción */}
                        <span className="stat-desc">% Lotes finalizados</span>
                    </div>
                </div>
            </div>


            {/* --- 2. GRÁFICAS --- */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

                {/* LINEAL: Producción Diaria */}
                <div className="chart-box line-chart">
                    <div className="chart-header">
                        <TrendingUp size={20} color="#00E808" />
                        <h2>Producción Diaria (Kg)</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="dia" stroke="#888" tick={{ fill: '#888' }} />
                            <YAxis stroke="#888" tick={{ fill: '#888' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="kgs"
                                name="Kilos Producidos"
                                stroke="#00E808"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#1e1e1e', strokeWidth: 2 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* BARRAS: Top Fórmulas */}
                <div className="chart-box bar-chart">
                    <div className="chart-header">
                        <BarChart3 size={20} color="#FF0037" />
                        <h2>Top Fórmulas</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.barData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                            <XAxis type="number" stroke="#888" />
                            <YAxis
                                dataKey="nombre"
                                type="category"
                                width={120}
                                stroke="#888"
                                style={{ fontSize: '11px' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar
                                dataKey="lotes"
                                name="Lotes Completados"
                                fill="#FF0037"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* PASTEL: Top Operadores (Ocupa ancho completo si es impar o se ajusta) */}
                <div className="chart-box pie-chart" style={{ gridColumn: '1 / -1' }}>
                    <div className="chart-header">
                        <PieIcon size={20} color="#3CA7FF" />
                        <h2>Eficiencia por Operador</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                                {stats.pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
}