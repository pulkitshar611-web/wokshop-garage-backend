const express = require('express');
const router = express.Router();
const dropdownOptionsController = require('../controllers/dropdownOptionsController');
const { authenticate } = require('../middleware/auth');

const auth = authenticate();

router.get('/', auth, dropdownOptionsController.getOptions);
router.post('/', auth, dropdownOptionsController.addOption);

module.exports = router;
