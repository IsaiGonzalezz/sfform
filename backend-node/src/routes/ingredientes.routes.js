const express = require('express');
const router = express.Router();
const ingredientesController = require('../controllers/ingredientes.controller');

router.get('/', ingredientesController.getIngredientes);
router.get('/:id', ingredientesController.getIngredienteById);
router.post('/', ingredientesController.createIngrediente);
router.put('/:id', ingredientesController.updateIngrediente);
router.delete('/:id', ingredientesController.deleteIngrediente);

module.exports = router;