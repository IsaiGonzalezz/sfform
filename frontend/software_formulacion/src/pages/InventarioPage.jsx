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
    Grid,
    IconButton
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

// Icono Excel "Oficial"
function ExcelIcon(props) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path fill="#2E7D32" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
            <path fill="#4CAF50" d="M14 2v6h6" />
            <path fill="#FFFFFF" d="M10.41 16.59L12 14.17l1.59 2.42c.19.28.49.41.79.41.61 0 1.01-.5.79-1.09l-1.9-2.91 1.79-2.7c.2-.29.07-.81-.31-.81-.32 0-.59.13-.78.42L12 12.41l-1.61-2.5c-.19-.29-.46-.42-.78-.42-.37 0-.5.52-.31.81l1.8 2.7-1.9 2.91c-.21.59.18 1.09.79 1.09.3 0 .6-.13.79-.41z" />
        </SvgIcon>
    );
}

// --- COMPONENTE DE FILA EXPANDIBLE (Row) ---
function Row({ row }) {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            {/* Fila Principal - CLICKABLE */}
            <TableRow
                hover
                onClick={() => setOpen(!open)}
                sx={{
                    cursor: 'pointer',
                    '& > *': { borderBottom: 'unset' },
                    // Fondo sutil al expandir (funciona en ambos modos)
                    backgroundColor: open ? 'rgba(60, 167, 255, 0.08)' : 'inherit',
                    transition: 'background-color 0.2s'
                }}
            >
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon sx={{ color: '#3CA7FF' }} /> : <KeyboardArrowDownIcon sx={{ color: 'var(--text-color)', opacity: 0.6 }} />}
                    </IconButton>
                </TableCell>
                {/* Datos de la fila */}
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}>{row.op}</TableCell>
                <TableCell sx={{ color: 'var(--text-color)' }}>{row.folio}</TableCell>
                <TableCell sx={{ color: 'var(--text-color)' }}>{row.lote}</TableCell>
                <TableCell>
                    <Chip
                        label={row.estatus === 1 ? 'TERMINADO' : 'PENDIENTE'}
                        size="small"
                        sx={{
                            backgroundColor: row.estatus === 1 ? 'rgba(0, 232, 8, 0.15)' : 'rgba(255, 187, 40, 0.15)',
                            color: row.estatus === 1 ? '#00c707' : '#e6a800', // Colores un poco más oscuros para leerse en blanco
                            fontWeight: 'bold', borderRadius: '6px',
                            border: row.estatus === 1 ? '1px solid rgba(0, 232, 8, 0.3)' : '1px solid rgba(255, 187, 40, 0.3)'
                        }}
                    />
                </TableCell>
                <TableCell align="right" sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>{row.pesForm.toLocaleString()} kg</TableCell>
                <TableCell sx={{ color: 'var(--text-color)' }}>{row.fecha}</TableCell>
            </TableRow>

            {/* Fila de Detalle (Desplegable) */}
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{
                            margin: '16px 0',
                            padding: 3,
                            // Fondo ligeramente contrastante dentro de la tarjeta
                            backgroundColor: 'var(--bg-color)',
                            borderRadius: 3,
                            border: '1px solid var(--border-color)',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <Typography variant="h6" gutterBottom component="div" sx={{ color: '#3CA7FF', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <TableViewIcon fontSize="small" /> Detalles del Lote {row.lote}
                            </Typography>

                            <Grid container spacing={4}>
                                {/* Columna 1: Identificación */}
                                <Grid item xs={12} md={4}>
                                    <Box mb={2}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-color)', opacity: 0.7 }}>Fórmula:</Typography>
                                        <Typography variant="body1" sx={{ color: 'var(--text-color)', fontWeight: 500 }}>{row.nombreFormula}</Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--text-color)', opacity: 0.6 }}>ID: {row.idForm}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-color)', opacity: 0.7 }}>Operador:</Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box sx={{
                                                width: 24, height: 24, borderRadius: '50%',
                                                bgcolor: 'var(--border-color)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--text-color)', fontSize: '0.75rem', fontWeight: 'bold'
                                            }}>JP</Box>
                                            <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>{row.usuario}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Columna 2: Métricas de Peso */}
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-color)', opacity: 0.7 }}>Balance de Pesos:</Typography>
                                    <Box sx={{ bgcolor: 'var(--card-bg)', p: 2, borderRadius: 2, border: '1px solid var(--border-color)' }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" display="block" sx={{ color: 'var(--text-color)', opacity: 0.6 }}>Objetivo</Typography>
                                                <Typography variant="body1" sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>{row.pesForm} kg</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" display="block" sx={{ color: 'var(--text-color)', opacity: 0.6 }}>Real</Typography>
                                                <Typography variant="body1" sx={{ color: row.estatus === 1 ? '#00c707' : '#e6a800', fontWeight: 'bold' }}>{row.pesoReal} kg</Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Box sx={{ borderTop: '1px solid var(--border-color)', pt: 1, mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>Diferencia:</Typography>
                                                    <Typography variant="body2" sx={{ color: row.diferencia > 0 ? '#FF0037' : (row.diferencia < 0 ? '#FFBB28' : 'var(--text-color)'), fontWeight: 'bold' }}>
                                                        {row.diferencia > 0 ? `+${row.diferencia}` : row.diferencia} kg
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>

                                {/* Columna 3: Tiempos y Acciones */}
                                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-color)', opacity: 0.7 }}>Línea de Tiempo:</Typography>
                                        <Box display="flex" flexDirection="column" gap={1}>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.6 }}>Inicio:</Typography>
                                                <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>{row.fecha} 08:30 AM</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.6 }}>Fin:</Typography>
                                                <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>{row.estatus === 1 ? '2025-12-03 04:45 PM' : '-'}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Button variant="outlined" size="small" startIcon={<Inventory2Icon />} sx={{ mt: 2, width: '100%', borderColor: '#3CA7FF', color: '#3CA7FF' }}>
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

    // Datos Mock
    const rows = [
        { id: 1, folio: 1001, op: 'OP-53F34', lote: 'LOTE-2A3D', pesForm: 1200, pesoReal: 1198, diferencia: -2, estatus: 0, fecha: '2025-12-04', usuario: 'Juan Perez', nombreFormula: 'Paracetamol 500mg', idForm: 'F-PARA-500' },
        { id: 2, folio: 1002, op: 'OP-34A99', lote: 'LOTE-B991', pesForm: 3500, pesoReal: 3500, diferencia: 0, estatus: 1, fecha: '2025-12-03', usuario: 'Maria Lopez', nombreFormula: 'Jarabe Tos', idForm: 'F-JAR-TOS' },
        { id: 3, folio: 1003, op: 'OP-12C12', lote: 'LOTE-C123', pesForm: 500, pesoReal: 510, diferencia: 10, estatus: 1, fecha: '2025-12-02', usuario: 'Carlos Ruiz', nombreFormula: 'Vitamina C', idForm: 'F-VIT-C' },
        { id: 4, folio: 1004, op: 'OP-99X00', lote: 'LOTE-X001', pesForm: 1500, pesoReal: 1480, diferencia: -20, estatus: 0, fecha: '2025-12-01', usuario: 'Juan Perez', nombreFormula: 'Ibuprofeno', idForm: 'F-IBU-600' },
    ];

    return (
        <Box className="produccion-page" sx={{ width: '100%', pb: 4 }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* 1. Header & Botones de Exportación */}
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
                            sx={{
                                backgroundColor: '#D32F2F', color: '#fff', px: 3,
                                '&:hover': { backgroundColor: '#b71c1c' },
                                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                            }}
                        >
                            Exportar PDF
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<ExcelIcon />}
                            sx={{
                                backgroundColor: '#2E7D32', color: '#fff', px: 3,
                                '&:hover': { backgroundColor: '#1b5e20' },
                                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                            }}
                        >
                            Exportar Excel
                        </Button>
                    </Box>
                </Box>

                {/* 2. Barra de Filtros */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 1, pl: 2, mb: 4,
                        backgroundColor: 'var(--card-bg)', // Adaptable
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', gap: 1,
                        border: '1px solid var(--border-color)',
                        flexWrap: 'wrap',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                    }}
                >
                    {/* Buscador */}
                    <TextField
                        placeholder="Buscar por OP, Folio, Lote o Fórmula..."
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            flexGrow: 1, minWidth: '300px',
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'transparent',
                                '& fieldset': { border: 'none' } // Sin borde interno
                            },
                            '& input': { color: 'var(--text-color)' }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'var(--text-color)', opacity: 0.5 }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', mx: 1, display: { xs: 'none', md: 'block' } }} />

                    {/* Filtros */}
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            displayEmpty
                            size="small"
                            startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1, color: '#3CA7FF' }} />}
                            sx={{
                                minWidth: 130,
                                backgroundColor: 'var(--bg-color)', // Fondo diferente a la tarjeta
                                borderRadius: 8,
                                color: 'var(--text-color)',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' }
                            }}
                        >
                            <MenuItem value="todos">Todos</MenuItem>
                            <MenuItem value="pendientes">Pendientes</MenuItem>
                            <MenuItem value="terminados">Terminados</MenuItem>
                        </Select>

                        <Box display="flex" alignItems="center" gap={1} sx={{ backgroundColor: 'var(--bg-color)', borderRadius: 8, p: '6px 12px', border: '1px solid var(--border-color)' }}>
                            <CalendarTodayIcon fontSize="small" sx={{ color: 'var(--text-color)', opacity: 0.6 }} />
                            <input
                                type="date"
                                value={desde}
                                onChange={(e) => setDesde(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'var(--text-color)',
                                    fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none',
                                    colorScheme: 'light dark' // <-- TRUCO PARA EL ICONO DEL CALENDARIO
                                }}
                            />
                            <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.6 }}>-</Typography>
                            <input
                                type="date"
                                value={hasta}
                                onChange={(e) => setHasta(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'var(--text-color)',
                                    fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none',
                                    colorScheme: 'light dark'
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>

                {/* 3. Tabla de Datos */}
                <Paper sx={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', borderRadius: 3 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="collapsible table">
                            <TableHead>
                                <TableRow>
                                    <TableCell width="40" sx={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }} />
                                    <TableCell sx={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Orden (OP)</TableCell>
                                    <TableCell sx={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Folio</TableCell>
                                    <TableCell sx={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Lote</TableCell>
                                    <TableCell sx={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Estatus</TableCell>
                                    <TableCell align="right" sx={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Peso Meta</TableCell>
                                    <TableCell sx={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Fecha</TableCell>
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
                    <Box sx={{ p: 2, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-color)' }}>
                        <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.7 }}>
                            Total: <strong>{rows.length}</strong> producciones
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-color)', opacity: 0.6 }}>
                            Mostrando 1-4 de 4
                        </Typography>
                    </Box>
                </Paper>

            </Container>
        </Box>
    );
};

export default InventarioPage;