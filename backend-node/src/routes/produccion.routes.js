const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccion.controller');

router.get('/', produccionController.getProducciones);
router.get('/:folio', produccionController.getProduccionByFolio);
router.post('/', produccionController.createProduccion);
router.put('/:folio', produccionController.updateProduccion);
router.patch('/:folio', produccionController.patchProduccion);
router.delete('/:op', produccionController.deleteProduccion);
router.patch('/desactivar-op/:op', produccionController.desactivarPorOP);

module.exports = router;