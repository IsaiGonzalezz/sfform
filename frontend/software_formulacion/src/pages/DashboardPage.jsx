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
    Loader2,
    Filter, // Icono para el botón de filtrar
    X       // Icono para limpiar filtros
} from 'lucide-react';

// --- IMPORTAMOS COMPONENTES DE MUI PARA QUE SE VEA PRO ---
import { Box, TextField, Button, Stack } from '@mui/material';

import './styles/Dashboard.css';

// Colores neón/vibrantes para el gráfico de pastel
const PIE_COLORS = ['#00E808', '#FF0037', '#3CA7FF', '#FFBB28', '#FF8042'];

const API_URL_DASHBOARD_REL = '/resumen/';

export default function Dashboard() {

    const { axiosInstance } = useAuth();

    // --- ESTADOS PARA FILTROS ---
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterTrigger, setFilterTrigger] = useState(0); // Para forzar recarga al filtrar

    // Estado inicial seguro
    const [stats, setStats] = useState({
        lineData: [],
        pieData: [],
        barData: [],
        kpi: { pendientes: 0, completados: 0, precision: 0 }
    });
    const [loading, setLoading] = useState(true);

    // --- MANEJADORES DE FILTRO ---
    const handleFilter = () => {
        setFilterTrigger(prev => prev + 1); // Dispara el useEffect
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        setFilterTrigger(prev => prev + 1); // Dispara el useEffect con valores vacíos
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Construcción dinámica de la URL con parámetros
                let url = API_URL_DASHBOARD_REL;
                const params = [];

                if (startDate) params.push(`startDate=${startDate}`);
                if (endDate) params.push(`endDate=${endDate}`);

                if (params.length > 0) {
                    url += `?${params.join('&')}`;
                }

                const response = await axiosInstance.get(url);
                const data = response.data;

                // Mapeo directo de tu JSON del backend al estado
                setStats({
                    lineData: data.lineChart || [],
                    pieData: data.pieChart ? data.pieChart.map((item, index) => ({
                        ...item,
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
        // Se ejecuta al montar y cada vez que cambia filterTrigger
    }, [axiosInstance, filterTrigger]);

    return (
        <div className="dashboard">
            {/* --- HEADER CON TITULO Y FILTROS --- */}
            {/* Usamos un contenedor Flex para separar Título (Izq) de Filtros (Der) */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' }, // Columna en móvil, Fila en PC
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                mb: 3,
                gap: 2
            }}>

                {/* Título */}
                <div className="dashboard-header" style={{ marginBottom: 0 }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <TrendingUp color="#3CA7FF" /> Panel de Control
                    </h1>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                        Vista general de producción en tiempo real
                    </p>
                </div>

                {/* Barra de Filtros (Redondeada y Moderna) */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <TextField
                        type="date"
                        label="Inicio"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{
                            width: 150,
                            // Estilo para redondear el input
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '20px',
                                backgroundColor: 'background.paper' // Mejor contraste
                            }
                        }}
                    />
                    <TextField
                        type="date"
                        label="Fin"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        sx={{
                            width: 150,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '20px',
                                backgroundColor: 'background.paper'
                            }
                        }}
                    />

                    {/* Botón Filtrar */}
                    <Button
                        variant="contained"
                        size="medium"
                        onClick={handleFilter}
                        startIcon={<Filter size={18} />}
                        sx={{
                            backgroundColor: '#3CA7FF',
                            '&:hover': { backgroundColor: '#2b8ac9' },
                            textTransform: 'none',
                            fontWeight: '600',
                            borderRadius: '20px', // Borde redondeado
                            paddingX: 3,          // Más ancho para verse mejor
                            boxShadow: 'none'     // Más plano y limpio
                        }}
                    >
                        Filtrar
                    </Button>

                    {/* Botón Limpiar (Circular) */}
                    {(startDate || endDate) && (
                        <Button
                            variant="outlined"
                            size="small" // Un poco más chico para que sea sutil
                            onClick={handleClear}
                            color="error"
                            sx={{
                                minWidth: '40px',
                                height: '40px',
                                borderRadius: '50%', // Círculo perfecto
                                padding: 0,
                                border: '1px solid rgba(211, 47, 47, 0.5)'
                            }}
                        >
                            <X size={20} />
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* --- ESTADO DE CARGA --- */}
            {loading ? (
                <div className="dashboard-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#888' }}>
                    <Loader2 className="spin-slow" size={48} color="#3CA7FF" />
                    <p style={{ marginTop: 10 }}>Calculando estadísticas...</p>
                </div>
            ) : (
                <>
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
                                <span className="stat-desc">Lotes pendientes (Actual)</span>
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
                                {/* Descripción dinámica según filtro */}
                                <span className="stat-desc">
                                    {(startDate || endDate) ? 'En periodo seleccionado' : 'Este mes'}
                                </span>
                            </div>
                        </div>

                        {/* Card: Eficiencia */}
                        <div className="stat-card" style={{ borderLeft: '4px solid #3CA7FF' }}>
                            <div className="stat-icon-container" style={{ background: 'rgba(60, 167, 255, 0.15)', color: '#3CA7FF' }}>
                                <Award size={24} className="spin-hover" />
                            </div>
                            <div className="stat-info">
                                <h3 className="stat-title">Eficiencia Global</h3>
                                <p className="stat-number">{stats.kpi.precision}%</p>
                                <span className="stat-desc">% Lotes finalizados</span>
                            </div>
                        </div>
                    </div>

                    {/* --- 2. GRÁFICAS --- */}
                    <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

                        {/* LINEAL: Producción Diaria */}
                        <div className="chart-box line-chart">
                            <div className="chart-header">
                                <TrendingUp size={20} color="#FF8000FF" />
                                <h2>Producción Diaria (Kg)</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={stats.lineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                    <XAxis dataKey="dia" stroke="#888" tick={{ fill: '#888' }} />
                                    <YAxis stroke="#888" tick={{ fill: '#888' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card-bg)',
                                            borderColor: 'var(--border-color)',
                                            borderRadius: '8px'
                                        }}
                                        itemStyle={{ color: 'var(--text-color)' }}
                                        labelStyle={{ color: 'var(--text-color)' }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="kgs"
                                        name="Kilos Producidos"
                                        stroke="#FF8000FF"
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                                    <XAxis type="number" stroke="#888" />
                                    <YAxis
                                        dataKey="nombre"
                                        type="category"
                                        width={120}
                                        stroke="#888"
                                        style={{ fontSize: '11px' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(136, 136, 136, 0.1)' }}
                                        contentStyle={{
                                            backgroundColor: 'var(--card-bg)',
                                            borderColor: 'var(--border-color)',
                                            borderRadius: '8px'
                                        }}
                                        itemStyle={{ color: 'var(--text-color)' }}
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

                        {/* PASTEL: Top Operadores */}
                        <div className="chart-box pie-chart" style={{ gridColumn: '1 / -1' }}>
                            <div className="chart-header">
                                <PieIcon size={20} color="#1FFF27FF" />
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
                                        contentStyle={{
                                            backgroundColor: 'var(--card-bg)',
                                            borderColor: 'var(--border-color)',
                                            borderRadius: '8px',
                                            color: 'var(--text-color)'
                                        }}
                                        itemStyle={{ color: 'var(--text-color)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}