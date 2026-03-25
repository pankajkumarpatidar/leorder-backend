const express = require('express');
const router = express.Router();

const controller = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔓 PUBLIC
router.post('/register', controller.register);
router.post('/login', controller.login);


// 🔒 CREATE USER (ADMIN ONLY)
router.post(
  '/create-user',
  verifyToken,
  checkRole('admin'),
  controller.createUser
);

module.exports = router;