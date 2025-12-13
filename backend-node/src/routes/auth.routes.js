const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/token/  (Login)
router.post('/', authController.login);

// POST /api/token/refresh/ (Refrescar)
router.post('/refresh/', authController.refreshToken);

module.exports = router;