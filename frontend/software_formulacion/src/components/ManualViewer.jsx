import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Typography, IconButton, CircularProgress, Paper, Tooltip, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles'; // <--- Importante para el tema
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';

// --- CONFIGURACIÓN DEL WORKER ---
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function ManualViewer({ fileUrl, onClose }) {
  const theme = useTheme(); // Accedemos al tema actual (dark/light)
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.2); // Zoom inicial

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Define colores basados en el tema
  const bgColor = theme.palette.mode === 'dark' ? '#2e2e2e' : '#e0e0e0';
  const toolbarColor = theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      bgcolor: bgColor, // Fondo dinámico
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* --- BARRA DE HERRAMIENTAS FLOTANTE --- */}
      <Paper 
        elevation={6} 
        sx={{ 
          position: 'absolute',
          bottom: 30, // La ponemos abajo al centro (estilo moderno)
          left: '50%',
          transform: 'translateX(-50%)',
          p: 1, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          borderRadius: '50px', 
          zIndex: 20,
          backgroundColor: toolbarColor,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Tooltip title="Alejar">
            <span>
                <IconButton onClick={() => setScale(s => Math.max(0.5, s - 0.1))} disabled={scale <= 0.5}>
                    <ZoomOutIcon />
                </IconButton>
            </span>
        </Tooltip>
        
        <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center', fontWeight: 'bold' }}>
          {Math.round(scale * 100)}%
        </Typography>

        <Tooltip title="Acercar">
            <span>
                <IconButton onClick={() => setScale(s => Math.min(2.5, s + 0.1))} disabled={scale >= 2.5}>
                    <ZoomInIcon />
                </IconButton>
            </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <Tooltip title="Restablecer Zoom">
          <IconButton onClick={() => setScale(1.0)}>
            <RestartAltIcon />
          </IconButton>
        </Tooltip>

        {onClose && (
            <>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Tooltip title="Cerrar Manual">
                    <IconButton onClick={onClose} color="error">
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </>
        )}
      </Paper>

      {/* --- ÁREA DEL DOCUMENTO (SCROLL INFINITO) --- */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        pt: 4,
        pb: 10, // Espacio extra abajo para que la barra no tape el final
        px: 2
      }}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
                <CircularProgress size={50} />
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>Cargando Manual...</Typography>
            </Box>
          }
          error={
            <Box sx={{ mt: 10, p: 3, bgcolor: 'error.light', borderRadius: 2 }}>
                <Typography color="error.contrastText">No se pudo cargar el PDF.</Typography>
            </Box>
          }
        >
          {/* Mapeamos TODAS las páginas para scroll continuo */}
          {Array.from(new Array(numPages), (el, index) => (
            <Paper 
                key={`page_${index + 1}`} 
                elevation={5} 
                sx={{ 
                    mb: 3, // Margen entre páginas
                    overflow: 'hidden',
                    // Asegura que la página blanca no brille demasiado en modo oscuro si se desea
                    filter: theme.palette.mode === 'dark' ? 'brightness(0.95)' : 'none' 
                }}
            >
                <Page 
                    pageNumber={index + 1} 
                    scale={scale} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                />
            </Paper>
          ))}
        </Document>
      </Box>
    </Box>
  );
}