const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');

// Ruta principal para llenar la tabla del frontend
router.get('/', inventarioController.getInventario);

module.exports = router;