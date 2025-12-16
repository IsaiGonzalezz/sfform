const { Router } = require('express');
const router = Router();

const { 
    getEstaciones, 
    getEstacionById,
    createEstacion, 
    updateEstacion, 
    deleteEstacion,
    activarEstacion 
} = require('../controllers/estaciones.controller');

// GET /api/estaciones/ -> Lista todas las activas
router.get('/', getEstaciones);

// GET /api/estaciones/:id -> Detalle de una
router.get('/:id', getEstacionById);

// POST /api/estaciones/ -> Crear
router.post('/', createEstacion);

// PUT /api/estaciones/:id -> Actualizar datos
router.put('/:id', updateEstacion);

// DELETE /api/estaciones/:id -> Borrado Lógico (Soft Delete)
router.patch('/:id', deleteEstacion);

//activar
router.put('/activar/:id', activarEstacion);


//router.delete('/:id', deleteEstacion); 

module.exports = router;