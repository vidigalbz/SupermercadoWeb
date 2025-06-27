const express = require('express');
const router = express.Router();

const setoresController = require('../controllers/setoresController');

router.post('/getSetor', setoresController.getSetor);
router.post('/addSetor', setoresController.addSetor);
router.post('/deleteSetor', setoresController.deleteSetor);

module.exports = router;