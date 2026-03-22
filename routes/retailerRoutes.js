const express = require('express');
const router = express.Router();

const controller = require('../controllers/retailerController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// 🔥 CREATE RETAILER
router.post(
  '/create',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.create
);

// 🔥 LIST RETAILERS
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);

// 🔥 GET SINGLE RETAILER
router.get(
  '/:id',
  verifyToken,
  controller.getOne
);

// 🔥 UPDATE RETAILER
router.put(
  '/:id',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.update
);

// 🔥 DELETE RETAILER
router.delete(
  '/:id',
  verifyToken,
  checkRole('admin'),
  controller.delete
);

module.exports = router;