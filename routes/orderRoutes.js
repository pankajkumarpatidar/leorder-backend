const express = require('express');
const router = express.Router();

const controller = require('../controllers/orderController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE ORDER
router.post(
  '/create',
  verifyToken,
  checkRole('admin', 'staff', 'salesman', 'retailer'),
  controller.create
);


// 🔥 ALL ORDERS
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);


// 🔥 MY ORDERS
router.get(
  '/my',
  verifyToken,
  checkRole('salesman'),
  controller.myOrders
);


// 🔥 GET ONE
router.get(
  '/:id',
  verifyToken,
  controller.getOne
);


// 🔥 UPDATE STATUS
router.post(
  '/status',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.updateStatus
);

module.exports = router;