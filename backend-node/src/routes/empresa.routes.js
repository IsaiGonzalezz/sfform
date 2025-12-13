const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresa.controller');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// --- Config Multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'logos_empresa/'; 
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Genera nombre único: timestamp-nombreOriginal
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage: storage });

// --- Endpoints ---

router.get('/', empresaController.getEmpresas);
router.get('/:rfc', empresaController.getEmpresaByRfc);

// POST: Crea
router.post('/', upload.single('logotipo'), empresaController.createEmpresa);

// PUT: Actualiza todo
router.put('/:rfc', upload.single('logotipo'), empresaController.updateEmpresa);

// PATCH: Actualiza parcial (AHORA SÍ INCLUIDO)
router.patch('/:rfc', upload.single('logotipo'), empresaController.patchEmpresa);

// DELETE: Elimina
router.delete('/:rfc', empresaController.deleteEmpresa);

module.exports = router;