const express = require('express');
const router = express.Router();

const controller = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// 🔥 REGISTER (Distributor signup)
router.post('/register', controller.register);

// 🔥 LOGIN
router.post('/login', controller.login);

// 🔥 CREATE USER (Distributor → Staff / Salesman)
router.post(
  '/create-user',
  verifyToken,
  checkRole('admin'), // distributor only
  controller.createUser
);

module.exports = router;