const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccion.controller');

router.get('/', produccionController.getProducciones);
router.get('/:folio', produccionController.getProduccionByFolio); // Ojo: parámetro :folio
router.post('/', produccionController.createProduccion);
router.put('/:folio', produccionController.updateProduccion);
router.patch('/:folio', produccionController.patchProduccion);
router.delete('/:folio', produccionController.deleteProduccion);

module.exports = router;