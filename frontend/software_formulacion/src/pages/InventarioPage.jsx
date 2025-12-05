import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Table,
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
    FormControl,
    Grid,
    Tooltip
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Iconos Modernos (MUI + Lucide style)
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SvgIcon from '@mui/material/SvgIcon';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// Icono de tabla para el detalle (más acorde que Inventory2)
import TableViewIcon from '@mui/icons-material/TableView'; 

// Icono Excel "Oficial" con Color
function ExcelIcon(props) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path fill="#2E7D32" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
            <path fill="#4CAF50" d="M14 2v6h6"/>
            <path fill="#FFFFFF" d="M10.41 16.59L12 14.17l1.59 2.42c.19.28.49.41.79.41.61 0 1.01-.5.79-1.09l-1.9-2.91 1.79-2.7c.2-.29.07-.81-.31-.81-.32 0-.59.13-.78.42L12 12.41l-1.61-2.5c-.19-.29-.46-.42-.78-.42-.37 0-.5.52-.31.81l1.8 2.7-1.9 2.91c-.21.59.18 1.09.79 1.09.3 0 .6-.13.79-.41z"/>
        </SvgIcon>
    );
}

// Tema Oscuro Moderno
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#3CA7FF' },
        secondary: { main: '#FF0037' },
        background: { default: '#121212', paper: '#1e1e1e' },
        text: { primary: '#e0e0e0', secondary: '#a0a0a0' }
    },
    typography: {
        fontFamily: '"Segoe UI", "Roboto", "Helvetica", sans-serif',
        h6: { fontWeight: 600 },
        subtitle2: { fontWeight: 600, color: '#888' },
        body2: { fontSize: '0.875rem' }
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none', borderRadius: 12 }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: { borderBottom: '1px solid #333', padding: '12px 16px' },
                head: { backgroundColor: '#252525', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }
            }
        },
        // Estilo para inputs más limpios (sin borde predeterminado, solo fondo)
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: '#2d2d2d',
                    borderRadius: 8,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, // Quita el borde default
                    '&:hover': { backgroundColor: '#383838' }, // Efecto hover sutil
                    '&.Mui-focused': { backgroundColor: '#383838', boxShadow: '0 0 0 2px #3CA7FF' } // Foco sutil
                },
                input: { padding: '10px 14px' }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 }
            }
        }
    }
});

// --- COMPONENTE DE FILA EXPANDIBLE (Row) ---
function Row({ row }) {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            {/* Fila Principal - CLICKABLE */}
            <TableRow 
                hover 
                onClick={() => setOpen(!open)} // <-- ¡AQUÍ ESTÁ LA MAGIA! Click en toda la fila
                sx={{ 
                    cursor: 'pointer',
                    '& > *': { borderBottom: 'unset' }, 
                    backgroundColor: open ? 'rgba(60, 167, 255, 0.08)' : 'inherit', // Color de fondo al expandir
                    transition: 'background-color 0.2s'
                }}
            >
                <TableCell>
                    {/* Flecha indicadora (visual, no clickable) */}
                    {open ? <KeyboardArrowUpIcon sx={{ color: '#3CA7FF' }} /> : <KeyboardArrowDownIcon sx={{ color: '#666' }} />}
                </TableCell>
                {/* Datos de la fila (basados en la imagen) */}
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#fff' }}>{row.op}</TableCell>
                <TableCell>{row.folio}</TableCell>
                <TableCell>{row.lote}</TableCell>
                <TableCell>
                    <Chip 
                        label={row.estatus === 1 ? 'TERMINADO' : 'PENDIENTE'} 
                        size="small" 
                        sx={{ 
                            backgroundColor: row.estatus === 1 ? 'rgba(0, 232, 8, 0.2)' : 'rgba(255, 187, 40, 0.2)',
                            color: row.estatus === 1 ? '#00E808' : '#FFBB28',
                            fontWeight: 'bold', borderRadius: '6px'
                        }} 
                    />
                </TableCell>
                <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{row.pesForm.toLocaleString()} kg</TableCell>
                <TableCell>{row.fecha}</TableCell>
            </TableRow>

            {/* Fila de Detalle (Desplegable) */}
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: '16px 0', padding: 3, backgroundColor: '#181818', borderRadius: 3, border: '1px solid #333', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
                            <Typography variant="h6" gutterBottom component="div" sx={{ color: '#3CA7FF', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <TableViewIcon fontSize="small" /> Detalles del Lote {row.lote}
                            </Typography>
                            
                            {/* Grid de Información Detallada (Diseño más limpio) */}
                            <Grid container spacing={4}>
                                {/* Columna 1: Identificación */}
                                <Grid item xs={12} md={4}>
                                    <Box mb={2}>
                                        <Typography variant="subtitle2" gutterBottom>Fórmula:</Typography>
                                        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>{row.nombreFormula}</Typography>
                                        <Typography variant="caption" sx={{ color: '#666' }}>ID: {row.idForm}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>Operador:</Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.75rem' }}>JP</Box>
                                            <Typography variant="body2" sx={{ color: '#fff' }}>{row.usuario}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                
                                {/* Columna 2: Métricas de Peso (Destacadas) */}
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" gutterBottom>Balance de Pesos:</Typography>
                                    <Box sx={{ bgcolor: '#252525', p: 2, borderRadius: 2, border: '1px solid #333' }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" display="block" sx={{color:'#888'}}>Objetivo</Typography>
                                                <Typography variant="body1" sx={{color:'#fff', fontWeight:'bold'}}>{row.pesForm} kg</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" display="block" sx={{color:'#888'}}>Real</Typography>
                                                <Typography variant="body1" sx={{color: row.estatus === 1 ? '#00E808' : '#FFBB28', fontWeight:'bold'}}>{row.pesoReal} kg</Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Box sx={{borderTop:'1px solid #444', pt: 1, mt:1, display:'flex', justifyContent:'space-between'}}>
                                                    <Typography variant="body2">Diferencia:</Typography>
                                                     <Typography variant="body2" sx={{ color: row.diferencia > 0 ? '#FF0037' : (row.diferencia < 0 ? '#FFBB28' : '#888'), fontWeight:'bold' }}>
                                                        {row.diferencia > 0 ? `+${row.diferencia}` : row.diferencia} kg
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>

                                {/* Columna 3: Tiempos y Acciones */}
                                <Grid item xs={12} md={4} sx={{ display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                                     <Box>
                                         <Typography variant="subtitle2" gutterBottom>Línea de Tiempo:</Typography>
                                         <Box display="flex" flexDirection="column" gap={1}>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body2" sx={{color:'#888'}}>Inicio:</Typography>
                                                <Typography variant="body2">{row.fecha} 08:30 AM</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body2" sx={{color:'#888'}}>Fin:</Typography>
                                                <Typography variant="body2">{row.estatus === 1 ? '2025-12-03 04:45 PM' : '-'}</Typography>
                                            </Box>
                                         </Box>
                                     </Box>
                                     <Button variant="outlined" color="primary" size="small" startIcon={<Inventory2Icon />} sx={{ mt: 2, width: '100%', borderColor:'#3CA7FF', color:'#3CA7FF' }}>
                                        Ver Bitácora Completa
                                     </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

const InventarioPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('todos');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    // Datos Mock (Actualizados con ID de fórmula para el detalle)
    const rows = [
        { id: 1, folio: 1001, op: 'OP-53F34', lote: 'LOTE-2A3D', pesForm: 1200, pesoReal: 1198, diferencia: -2, estatus: 0, fecha: '2025-12-04', usuario: 'Juan Perez', nombreFormula: 'Paracetamol 500mg', idForm: 'F-PARA-500' },
        { id: 2, folio: 1002, op: 'OP-34A99', lote: 'LOTE-B991', pesForm: 3500, pesoReal: 3500, diferencia: 0, estatus: 1, fecha: '2025-12-03', usuario: 'Maria Lopez', nombreFormula: 'Jarabe Tos', idForm: 'F-JAR-TOS' },
        { id: 3, folio: 1003, op: 'OP-12C12', lote: 'LOTE-C123', pesForm: 500, pesoReal: 510, diferencia: 10, estatus: 1, fecha: '2025-12-02', usuario: 'Carlos Ruiz', nombreFormula: 'Vitamina C', idForm: 'F-VIT-C' },
        { id: 4, folio: 1004, op: 'OP-99X00', lote: 'LOTE-X001', pesForm: 1500, pesoReal: 1480, diferencia: -20, estatus: 0, fecha: '2025-12-01', usuario: 'Juan Perez', nombreFormula: 'Ibuprofeno', idForm: 'F-IBU-600' },
    ];

    return (
        <ThemeProvider theme={darkTheme}>
            <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#121212' }}>
                
                {/* 1. Header & Botones de Exportación Sólidos */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Paper sx={{ p: 1.2, backgroundColor: 'rgba(60, 167, 255, 0.1)', color: '#3CA7FF', borderRadius: 3 }}>
                            <Inventory2Icon fontSize="large" />
                        </Paper>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.5px', color:'#fff' }}>
                                Inventario de Producción
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
                                Consulta histórica y trazabilidad de lotes
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" gap={2}>
                        {/* Botón PDF Sólido */}
                        <Button
                            variant="contained"
                            startIcon={<PictureAsPdfIcon />}
                            sx={{ 
                                backgroundColor: '#D32F2F', // Rojo sólido
                                color: '#fff',
                                px: 3,
                                '&:hover': { backgroundColor: '#b71c1c' },
                                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                            }}
                        >
                            Exportar PDF
                        </Button>
                        {/* Botón Excel Sólido con Icono Oficial */}
                        <Button
                            variant="contained"
                            startIcon={<ExcelIcon />}
                            sx={{ 
                                backgroundColor: '#2E7D32', // Verde sólido
                                color: '#fff',
                                px: 3,
                                '&:hover': { backgroundColor: '#1b5e20' },
                                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                            }}
                        >
                            Exportar Excel
                        </Button>
                    </Box>
                </Box>

                {/* 2. Barra de Filtros "Flat & Clean" */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 1,
                        pl: 2,
                        mb: 4, 
                        backgroundColor: '#1e1e1e', 
                        borderRadius: 10, // Bordes muy redondeados
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: '1px solid #333',
                        flexWrap: 'wrap'
                    }}
                >
                    {/* Buscador Principal (Más limpio) */}
                    <TextField
                        placeholder="Buscar por OP, Folio, Lote o Fórmula..."
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1, minWidth: '300px', '& .MuiOutlinedInput-root': { backgroundColor: 'transparent' } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#666' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Divisor Sutil */}
                    <Box sx={{ width: '1px', height: '24px', backgroundColor: '#333', mx: 1, display: { xs: 'none', md: 'block' } }} />

                    {/* Filtros Compactos */}
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            displayEmpty
                            size="small"
                            startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1, color: '#3CA7FF' }} />}
                            sx={{ minWidth: 130, backgroundColor: '#2d2d2d !important', borderRadius: 8 }}
                        >
                            <MenuItem value="todos">Todos</MenuItem>
                            <MenuItem value="pendientes">Pendientes</MenuItem>
                            <MenuItem value="terminados">Terminados</MenuItem>
                        </Select>

                        <Box display="flex" alignItems="center" gap={1} sx={{ backgroundColor: '#2d2d2d', borderRadius: 8, p: '4px 8px', border: '1px solid #333' }}>
                            <CalendarTodayIcon fontSize="small" sx={{ color: '#666' }} />
                            <input 
                                type="date" 
                                value={desde}
                                onChange={(e) => setDesde(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none' }}
                            />
                            <Typography variant="body2" sx={{ color: '#666' }}>-</Typography>
                            <input 
                                type="date" 
                                value={hasta}
                                onChange={(e) => setHasta(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none' }}
                            />
                        </Box>
                    </Box>
                </Paper>

                {/* 3. Tabla de Datos (Expandible al clic) */}
                <Paper sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="collapsible table">
                            <TableHead>
                                <TableRow>
                                    <TableCell width="40" /> {/* Espacio para la flecha */}
                                    <TableCell>Orden (OP)</TableCell>
                                    <TableCell>Folio</TableCell>
                                    <TableCell>Lote</TableCell>
                                    <TableCell>Estatus</TableCell>
                                    <TableCell align="right">Peso Meta</TableCell>
                                    <TableCell>Fecha</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row) => (
                                    <Row key={row.id} row={row} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* Footer de la tabla */}
                    <Box sx={{ p: 2, borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#252525' }}>
                         <Typography variant="body2" sx={{ color: '#888' }}>
                            Total: <strong>{rows.length}</strong> producciones
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                            Mostrando 1-4 de 4
                        </Typography>
                    </Box>
                </Paper>

            </Container>
        </ThemeProvider>
    );
};

export default InventarioPage;