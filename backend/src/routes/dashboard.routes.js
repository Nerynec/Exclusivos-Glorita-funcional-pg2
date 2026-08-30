const express = require('express');
const ctrl = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/resumen', ctrl.resumen);

module.exports = router;
