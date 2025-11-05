import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar
} from 'recharts';
import './styles/Dashboard.css';

const lineData = [
    { name: 'Ene', Calidad: 80, Eficiencia: 65 },
    { name: 'Feb', Calidad: 85, Eficiencia: 70 },
    { name: 'Mar', Calidad: 78, Eficiencia: 60 },
    { name: 'Abr', Calidad: 90, Eficiencia: 75 },
];

const pieData = [
    { name: 'Todo', value: 15, color: '#00E808FF' },
    { name: 'Pendiente', value: 45, color: '#FF0037FF' },
    { name: 'En Proceso', value: 40, color: '#3CA7FFFF' },
];

const barData = [
    { name: 'Estación 1', Pendiente: 20, Producción: 40 },
    { name: 'Estación 2', Pendiente: 35, Producción: 50 },
    { name: 'Estación 3', Pendiente: 25, Producción: 60 },
    { name: 'Estación 4', Pendiente: 30, Producción: 45 },
    { name: 'Estación 5', Pendiente: 40, Producción: 55 },
];

export default function Dashboard() {
    return (
        <div className="dashboard">

            {/* --- 1. NUEVA FILA DE "CUADRITOS" --- */}
            <div className="stat-card stat-card-1">
                <h3 className="stat-title">Lotes Pendientes</h3>
                <p className="stat-number">45</p>
            </div>
            <div className="stat-card stat-card-2">
                <h3 className="stat-title">En Proceso</h3>
                <p className="stat-number">40</p>
            </div>
            <div className="stat-card stat-card-3">
                <h3 className="stat-title">Completados</h3>
                <p className="stat-number">15</p>
            </div>
            <div className="stat-card stat-card-4">
                <h3 className="stat-title">Calidad Prom.</h3>
                <p className="stat-number">83.2%</p>
            </div>


            {/* --- 2. TUS GRÁFICAS ORIGINALES (SIN MODIFICAR) --- */}
            <div className="chart-box line-chart">
                <h2>Indicadores Mensuales</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={lineData}>
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
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            label
                        >
                            {pieData.map((entry, index) => (
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
                    <BarChart data={barData}>
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