import React from 'react';
import {
    Box,
    Button,
    Chip,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Paper,
    Tooltip,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SvgIcon from '@mui/material/SvgIcon';

// Excel icon (custom SVG)
function ExcelIcon(props) {
    // Simple, recognizable Excel-style glyph
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            {/* Sheet */}
            <path fill="currentColor" d="M14 2h-6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8l-6-6z" />
            {/* Fold */}
            <path fill="currentColor" d="M14 2v6h6" opacity="0.4" />
            {/* X letter (Excel) */}
            <path
                fill="currentColor"
                d="M6.8 16.8l2.1-3.2-2-3.2h1.7l1.2 2.1 1.2-2.1h1.7l-2 3.2 2.1 3.2h-1.7l-1.3-2.2-1.3 2.2H6.8z"
            />
        </SvgIcon>
    );
}

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#90caf9' },
        secondary: { main: '#f48fb1' },
        success: { main: '#388E3C' },
        error: { main: '#D32F2F' },
        background: { default: '#0f1320', paper: '#131a2a' }
    },
    typography: {
        fontSize: 14
    },
    components: {
        MuiTableCell: {
            styleOverrides: {
                root: { padding: '10px 12px' }
            }
        }
    }
});

const InventarioView = () => {
    const [filtroTipo, setFiltroTipo] = React.useState('formula');
    const [desde, setDesde] = React.useState('');
    const [hasta, setHasta] = React.useState('');
    const [folio, setFolio] = React.useState('');
    const [op, setOp] = React.useState('');

    // Demo data
    const registros = [
        {
            formula: 'Fórmula A',
            loteFormula: 'L001',
            ingrediente: 'Ingrediente X',
            loteIngrediente: 'LX01',
            pesoReal: 1000,
            pesoObjetivo: 1000,
            diferencia: 0,
            pesoDescargado: 1000,
            pesoPendiente: 0
        },
        {
            formula: 'Fórmula B',
            loteFormula: 'L045',
            ingrediente: 'Ingrediente Y',
            loteIngrediente: 'LY77',
            pesoReal: 520,
            pesoObjetivo: 500,
            diferencia: 20,
            pesoDescargado: 480,
            pesoPendiente: 40
        }
    ];

    const totals = registros.reduce(
        (acc, r) => {
            acc.real += r.pesoReal;
            acc.obj += r.pesoObjetivo;
            acc.dif += r.diferencia;
            return acc;
        },
        { real: 0, obj: 0, dif: 0 }
    );

    return (
        <ThemeProvider theme={darkTheme}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Inventory2Icon color="primary" />
                    <Typography variant="h5">Registros de inventario</Typography>
                </Box>

                {/* Summary chips */}
                <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
                    <Chip icon={<AssessmentIcon />} label={`Total registros: ${registros.length}`} variant="outlined" />
                    <Chip color="success" label={`Peso real: ${totals.real.toLocaleString('es-MX')}`} />
                    <Chip color="primary" label={`Peso objetivo: ${totals.obj.toLocaleString('es-MX')}`} />
                    <Chip color={totals.dif === 0 ? 'default' : 'error'} label={`Diferencia: ${totals.dif.toLocaleString('es-MX')}`} />
                </Box>

                {/* Filtros panel */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box display="grid" gridTemplateColumns="repeat(6, minmax(0, 1fr))" gap={2}>
                            <TextField
                                label="Desde"
                                type="date"
                                value={desde}
                                onChange={(e) => setDesde(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Hasta"
                                type="date"
                                value={hasta}
                                onChange={(e) => setHasta(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <FormControl>
                                <InputLabel>Tipo</InputLabel>
                                <Select value={filtroTipo} label="Tipo" onChange={(e) => setFiltroTipo(e.target.value)}>
                                    <MenuItem value="formula">Fórmula</MenuItem>
                                    <MenuItem value="ingrediente">Ingrediente</MenuItem>
                                    <MenuItem value="usuario">Usuario</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField label="Folio" value={folio} onChange={(e) => setFolio(e.target.value)} />
                            <TextField label="O.P." value={op} onChange={(e) => setOp(e.target.value)} />
                            <Box display="flex" gap={1} alignItems="center">
                                <Button variant="contained" color="primary">Aplicar</Button>
                                <Button variant="outlined" color="primary" onClick={() => { setDesde(''); setHasta(''); setFolio(''); setOp(''); }}>
                                    Limpiar
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Export actions */}
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    <Button
                        variant="contained"
                        startIcon={<PictureAsPdfIcon />}
                        sx={{ backgroundColor: '#D32F2F', '&:hover': { backgroundColor: '#b71c1c' } }}
                    >
                        Exportar PDF
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<ExcelIcon sx={{ color: '#ffffff' }} />}
                        sx={{ backgroundColor: '#388E3C', '&:hover': { backgroundColor: '#2e7d32' } }}
                    >
                        Exportar Excel
                    </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Tabla */}
                <TableContainer component={Paper} sx={{ maxHeight: 520 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Fórmula</TableCell>
                                <TableCell>Lote fórmula</TableCell>
                                <TableCell>Ingrediente</TableCell>
                                <TableCell>Lote ingrediente</TableCell>
                                <TableCell align="right">Peso real</TableCell>
                                <TableCell align="right">Peso objetivo</TableCell>
                                <TableCell align="right">Diferencia</TableCell>
                                <TableCell align="right">Peso descargado</TableCell>
                                <TableCell align="right">Peso pendiente</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {registros.map((row, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{row.formula}</TableCell>
                                    <TableCell>{row.loteFormula}</TableCell>
                                    <TableCell>{row.ingrediente}</TableCell>
                                    <TableCell>{row.loteIngrediente}</TableCell>
                                    <TableCell align="right">{row.pesoReal}</TableCell>
                                    <TableCell align="right">{row.pesoObjetivo}</TableCell>
                                    <TableCell align="right">{row.diferencia}</TableCell>
                                    <TableCell align="right">{row.pesoDescargado}</TableCell>
                                    <TableCell align="right">{row.pesoPendiente}</TableCell>
                                    <TableCell>
                                        <Tooltip title="Ver detalle (placeholder)">
                                            <span>
                                                <IconButton color="primary" disabled>
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </ThemeProvider>
    );
};

export default InventarioView;