const { Router } = require('express');
const router = Router();

const { 
    getOperadores, 
    createOperador, 
    updateOperador, 
    deleteOperador 
} = require('../controllers/operadores.controller');

// GET /api/operadores
router.get('/', getOperadores);

// POST /api/operadores
router.post('/', createOperador);

// PUT /api/operadores/:id (Actualizar por RFID)
router.put('/:id', updateOperador);

// PATCH /api/operadores/:id (Soft Delete)
// Tu frontend usa .patch para borrar, así que esta es la buena
router.patch('/:id', deleteOperador); 

// DELETE por si acaso
router.delete('/:id', deleteOperador);

module.exports = router;