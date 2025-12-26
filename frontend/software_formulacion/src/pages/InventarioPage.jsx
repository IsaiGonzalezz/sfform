import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import ReporteInventario from '../components/ReporteInventario'; 
import { Box, Button, Container, Paper, Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Collapse,
    Chip,
    InputAdornment,
    MenuItem,
    Select,
    Grid,
    IconButton,
    CircularProgress,
    Alert,
    Divider,
    Avatar
} from '@mui/material';

// Iconos
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SvgIcon from '@mui/material/SvgIcon';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TableViewIcon from '@mui/icons-material/TableView';
import ScienceIcon from '@mui/icons-material/Science';
import ScaleIcon from '@mui/icons-material/Scale';

// URL RELATIVA
const API_URL_INVENTARIO_REL = '/inventario/';

// Icono Excel "Oficial"
function ExcelIcon(props) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path fill="#FDFFFDFF" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
            <path fill="#FFFFFFFF" d="M14 2v6h6" />
            <path fill="#03860EFF" d="M10.41 16.59L12 14.17l1.59 2.42c.19.28.49.41.79.41.61 0 1.01-.5.79-1.09l-1.9-2.91 1.79-2.7c.2-.29.07-.81-.31-.81-.32 0-.59.13-.78.42L12 12.41l-1.61-2.5c-.19-.29-.46-.42-.78-.42-.37 0-.5.52-.31.81l1.8 2.7-1.9 2.91c-.21.59.18 1.09.79 1.09.3 0 .6-.13.79-.41z" />
        </SvgIcon>
    );
}

// --- COMPONENTE DE FILA EXPANDIBLE (Row) ---
function Row({ row }) {
    const [open, setOpen] = useState(false);

    const fechaObj = new Date(row.fecha);
    const fechaFormateada = fechaObj.toLocaleDateString('es-MX');
    const horaFormateada = fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const isPending = row.estatus === 1;

    return (
        <>
            {/* FILA PRINCIPAL */}
            <TableRow
                hover
                onClick={() => setOpen(!open)}
                sx={{
                    cursor: 'pointer',
                    backgroundColor: open ? 'rgba(60,167,255,0.08)' : 'inherit'
                }}
            >
                <TableCell width={40}>
                    <IconButton size="small">
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{row.op}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{row.id_form}</TableCell>
                <TableCell>{row.lote}</TableCell>
                <TableCell>
                    <Chip
                        label={isPending ? 'PENDIENTE' : 'CERRADA'}
                        sx={{
                            bgcolor: isPending ? 'rgba(255,152,0,.15)' : 'rgba(0,200,83,.15)',
                            color: isPending ? '#ff9800' : '#00c853',
                            fontWeight: 700
                        }}
                    />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {row.p_obj} kg
                </TableCell>
                <TableCell>{fechaFormateada}</TableCell>
            </TableRow>

            {/* DETALLE DESPLEGABLE */}
            <TableRow>
                <TableCell colSpan={7} sx={{ p: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box
                            sx={{
                                m: 2,
                                borderRadius: 3,
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                bgcolor: 'var(--bg-color)'
                            }}
                        >
                            {/* HEADER DEL DETALLE */}
                            <Box
                                sx={{
                                    p: 2,
                                    borderBottom: '1px solid var(--border-color)',
                                    bgcolor: 'rgba(0,0,0,.03)'
                                }}
                            >
                                <Grid container spacing={3} alignItems="center">
                                    {/* Título Lote */}
                                    <Grid item xs={12} md={3}>
                                        <Typography
                                            variant="h6"
                                            sx={{ color: '#3CA7FF', fontWeight: 700 }}
                                        >
                                            Detalles del Lote {row.lote}
                                        </Typography>
                                    </Grid>

                                    {/* Info Adicional (Fórmula, Usuario, Operador, Fecha) */}
                                    <Grid item xs={12} md={9}>
                                        <Grid container spacing={4}>
                                            <Grid item xs={3}>
                                                <Typography variant="caption" sx={{ opacity: .6 }}>
                                                    FÓRMULA
                                                </Typography>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {row.nombre_formula}
                                                </Typography>
                                            </Grid>

                                            {/* USUARIO (Registro) */}
                                            <Grid item xs={3}>
                                                <Typography variant="caption" sx={{ opacity: .6 }}>
                                                    REGISTRÓ (USUARIO)
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 22, height: 22, bgcolor: '#3CA7FF', fontSize: '0.8rem' }}>
                                                        {row.nombre_usuario?.[0] || 'U'}
                                                    </Avatar>
                                                    <Typography noWrap>{row.nombre_usuario || 'Desconocido'}</Typography>
                                                </Box>
                                            </Grid>

                                            {/* OPERADOR (Trabajo) - NUEVO */}
                                            <Grid item xs={3}>
                                                <Typography variant="caption" sx={{ opacity: .6 }}>
                                                    OPERADOR
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 22, height: 22, bgcolor: '#FF9800', fontSize: '0.8rem' }}>
                                                        {row.nombre_operador?.[0] || '?'}
                                                    </Avatar>
                                                    <Typography 
                                                        noWrap 
                                                        sx={{ 
                                                            fontStyle: row.nombre_operador ? 'normal' : 'italic',
                                                            opacity: row.nombre_operador ? 1 : 0.6 
                                                        }}
                                                    >
                                                        {row.nombre_operador || 'No Asignado'}
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            <Grid item xs={3}>
                                                <Typography variant="caption" sx={{ opacity: .6 }}>
                                                    FECHA REGISTRO
                                                </Typography>
                                                <Typography>
                                                    {fechaFormateada} — {horaFormateada}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* CUERPO (Balances y Tablas) - Sin cambios, solo lo pego para que tengas todo junto */}
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={6}>
                                    {/* BALANCE */}
                                    <Grid item xs={12} md={4}>
                                        <Paper
                                            sx={{
                                                p: 3,
                                                height: '100%',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 3,
                                                textAlign: 'center'
                                            }}
                                        >
                                            <Typography variant="subtitle2" sx={{ opacity: .7, mb: 2 }}>
                                                Balance de Producción
                                            </Typography>

                                            <Grid container columnSpacing={6}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption">Objetivo</Typography>
                                                    <Typography variant="h5" fontWeight={700}>
                                                        {row.p_obj} kg
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption">Real</Typography>
                                                    <Typography
                                                        variant="h5"
                                                        fontWeight={700}
                                                        color={isPending ? '#ff9800' : '#00c853'}
                                                    >
                                                        {row.p_real?.toFixed(2)} kg
                                                    </Typography>
                                                </Grid>
                                            </Grid>

                                            <Divider sx={{ my: 2 }} />

                                            <Chip
                                                label={`Diferencia: ${row.p_dif?.toFixed(2)} kg`}
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </Paper>
                                    </Grid>

                                    {/* INGREDIENTES */}
                                    <Grid item xs={12} md={8}>
                                        <Paper
                                            sx={{
                                                p: 2,
                                                height: '100%',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 3
                                            }}
                                        >
                                            <Box
                                                display="flex"
                                                justifyContent="space-between"
                                                mb={1}
                                            >
                                                <Typography variant="subtitle2">
                                                    Ingredientes Utilizados
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: .6 }}>
                                                    {row.ingredientes?.length || 0} items
                                                </Typography>
                                            </Box>

                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Ingrediente</TableCell>
                                                        <TableCell align="right">Peso (kg)</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {(row.ingredientes || []).map((ing, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{ing.nombre_ingrediente}</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                                {ing.pesing}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}


const InventarioPage = () => {
    const { axiosInstance, user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('todos');
    const [empresaInfo, setEmpresaInfo] = useState(null);
    // CALCULO FECHAS POR DEFECTO
    const [desde, setDesde] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0]; 
    });

    const [hasta, setHasta] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1)
        return d.toISOString().split('T')[0];
    });

    const [rows, setRows] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const componentRef = useRef();

    // --- CARGAR DATOS ---
    useEffect(() => {
        const fetchInventario = async () => {
            if (!axiosInstance) return;
            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                params.append('desde', desde);
                params.append('hasta', hasta);

                if (filterType === 'pendientes') params.append('estatus', 1);
                if (filterType === 'terminados') params.append('estatus', 0);
                
                const [invRes, empresaRes] = await Promise.all([
                    axiosInstance.get(`/inventario/?${params.toString()}`),
                    axiosInstance.get('/empresa/')
                ]);

                //const response = await axiosInstance.get(`/inventario/?${params.toString()}`);

                setRows(invRes.data);
                setFilteredRows(empresaRes.data); 

                if (empresaRes.data && empresaRes.data.length > 0) {
                    setEmpresaInfo(empresaRes.data[0]);
                }

            } catch (err) {
                console.error("Error al cargar inventario:", err);
                setError('No se pudo cargar el historial.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInventario();

    }, [axiosInstance, desde, hasta, filterType]);


    // --- BUSCADOR LOCAL ---
    useEffect(() => {
        let data = rows;

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            data = data.filter(item => 
                (item.op && item.op.toLowerCase().includes(lowerSearch)) ||
                (item.lote && item.lote.toLowerCase().includes(lowerSearch)) ||
                (item.nombre_formula && item.nombre_formula.toLowerCase().includes(lowerSearch)) ||
                (item.folio_produccion && item.folio_produccion.toString().includes(lowerSearch)) ||
                (item.id_form && item.id_form.toLowerCase().includes(lowerSearch))
            );
        }
        setFilteredRows(data);
    }, [searchTerm, rows]);

    
    // --- LÓGICA EXPORTAR EXCEL (CON EXCELJS - SEGURO) ---
    const handleExportExcel = async () => {
        if (filteredRows.length === 0) {
            alert("No hay datos para exportar");
            return;
        }

        // 1. Crear el libro y la hoja
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventario');

        // 2. Definir columnas (Header = Título, Key = dato, Width = ancho)
        worksheet.columns = [
            { header: 'OP', key: 'op', width: 15 },
            { header: 'Lote', key: 'lote', width: 15 },
            { header: 'Fórmula', key: 'formula', width: 30 },
            { header: 'Fecha Registro', key: 'fecha', width: 20 },
            { header: 'Usuario', key: 'usuario', width: 20 },
            { header: 'Peso Obj (kg)', key: 'p_obj', width: 15 },
            { header: 'Peso Real (kg)', key: 'p_real', width: 15 },
            { header: 'Diferencia', key: 'diferencia', width: 15 },
            { header: 'Estatus', key: 'estatus', width: 15 },
            { header: 'Ingredientes', key: 'total_ing', width: 12 },
        ];

        // 3. Dar estilo a la cabecera (Negritas y centrado) - OPCIONAL PERO SE VE PRO
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // 4. Agregar filas
        filteredRows.forEach(row => {
            worksheet.addRow({
                op: row.op,
                lote: row.lote,
                formula: row.nombre_formula,
                fecha: new Date(row.fecha).toLocaleDateString('es-MX') + ' ' + new Date(row.fecha).toLocaleTimeString('es-MX'),
                usuario: row.nombre_usuario,
                p_obj: parseFloat(row.p_obj),
                p_real: parseFloat(row.p_real),
                diferencia: parseFloat(row.p_dif),
                estatus: row.estatus === 1 ? 'PENDIENTE' : 'CERRADA',
                total_ing: row.ingredientes ? row.ingredientes.length : 0
            });
        });

        // 5. Generar el buffer y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Inventario_${desde}_al_${hasta}.xlsx`);
    };
    
    // --- LÓGICA EXPORTAR PDF ---
    const handleExportPdf = () => {
        if (filteredRows.length === 0) {
            alert("No hay datos para exportar");
            return;
        }

        const element = componentRef.current;
        const opt = {
            margin: 10,
            filename: `Inventario_${desde}_al_${hasta}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' } // Landscape para que quepan las columnas
        };

        html2pdf().from(element).set(opt).save();
    };

    return (
        <Box className="produccion-page" sx={{ width: '100%', pb: 4 }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* 1. Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Paper sx={{ p: 1.2, backgroundColor: 'rgba(60, 167, 255, 0.1)', color: '#3CA7FF', borderRadius: 3, boxShadow: 'none' }}>
                            <Inventory2Icon fontSize="large" />
                        </Paper>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text-color)' }}>
                                Inventario de Producción
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.6, mt: 0.5 }}>
                                Consulta histórica y trazabilidad de lotes
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" gap={2}>
                        <Button
                            variant="contained"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={handleExportPdf}
                            sx={{ backgroundColor: '#D32F2F',borderRadius: '50px',color: '#fff', '&:hover': { backgroundColor: '#b71c1c' } }}
                        >
                            Exportar PDF
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<ExcelIcon />}
                            onClick={handleExportExcel}
                            sx={{ backgroundColor: '#269326FF',borderRadius: '50px', color: '#fff', '&:hover': { backgroundColor: '#1b5e20' } }}
                        >
                            Exportar Excel
                        </Button>
                    </Box>
                </Box>

                {/* 2. Filtros */}
                <Paper sx={{ p: 1, pl: 2, mb: 4, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 10, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Buscar por OP, Folio, Lote o Fórmula..."
                        variant="outlined" size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1, minWidth: '300px', '& fieldset': { border: 'none' } }}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ opacity: 0.5 }} /></InputAdornment>) }}
                    />
                    <Box sx={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', mx: 1 }} />
                    
                    <Box display="flex" gap={1} alignItems="center">
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            size="small"
                            sx={{ minWidth: 130, borderRadius: 8 }}
                        >
                            <MenuItem value="todos">Todos</MenuItem>
                            <MenuItem value="pendientes">Pendientes</MenuItem>
                            <MenuItem value="terminados">Cerradas</MenuItem>
                        </Select>

                        <Box display="flex" alignItems="center" gap={1} sx={{ borderRadius: 8, p: '6px 12px', border: '1px solid var(--border-color)' }}>
                            <CalendarTodayIcon fontSize="small" sx={{ opacity: 0.6 }} />
                            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={{ background: 'transparent', border: 'none', fontFamily: 'inherit', color:'var(--text-color)' }} />
                            <Typography variant="body2" sx={{ opacity: 0.6 }}>-</Typography>
                            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={{ background: 'transparent', border: 'none', fontFamily: 'inherit', color:'var(--text-color)' }} />
                        </Box>
                    </Box>
                </Paper>

                {/* 3. Tabla */}
                {isLoading ? (
                    <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="40" />
                                        <TableCell sx={{ fontWeight: 'bold' }}>Orden (OP)</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Id Fórmula</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Lote</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Estatus</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Peso Meta</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredRows.length > 0 ? (
                                        filteredRows.map((row, index) => <Row key={index} row={row} />)
                                    ) : (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, opacity: 0.6 }}>No se encontraron resultados</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>Total: <strong>{filteredRows.length}</strong> producciones encontradas</Typography>
                        </Box>
                    </Paper>
                )}

                {/* --- COMPONENTE OCULTO PARA PDF --- */}
                {/* Lo renderizamos pero lo escondemos visualmente, solo se usa para html2pdf */}
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <ReporteInventario 
                        ref={componentRef} 
                        data={filteredRows} 
                        rangoFechas={{ desde, hasta }}
                        usuario={user ? user.nombre : ''}
                        empresa={empresaInfo}
                    />
                </div>
            </Container>
        </Box>
    );
};

export default InventarioPage;