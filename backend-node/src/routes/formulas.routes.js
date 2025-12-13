const express = require('express');
const router = express.Router();
const formulasController = require('../controllers/formulas.controller');

router.get('/', formulasController.getFormulas);
router.get('/:id', formulasController.getFormulaById);
router.post('/', formulasController.createFormula);
router.put('/:id', formulasController.updateFormula);
router.patch('/:id', formulasController.patchFormula);
router.delete('/:id', formulasController.deleteFormula);

module.exports = router;