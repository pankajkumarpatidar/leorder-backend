const express = require('express');
const router = express.Router();

const controller = require('../controllers/orderController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE ORDER
// ✔ Admin / Staff / Salesman / Retailer
router.post(
  '/create',
  verifyToken,
  checkRole('admin', 'staff', 'salesman', 'retailer'),
  controller.create
);


// 🔥 GET ALL ORDERS
// ✔ Admin + Staff only
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);


// 🔥 GET SINGLE ORDER
// ✔ All roles (लेकिन restriction controller में)
router.get(
  '/:id',
  verifyToken,
  controller.getOne
);


// 🔥 UPDATE STATUS
// ✔ Admin + Staff only
router.post(
  '/status',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.updateStatus
);


// 🔥 OPTIONAL (future use)
// ✔ Salesman → apne orders
router.get(
  '/my',
  verifyToken,
  checkRole('salesman'),
  controller.myOrders
);

module.exports = router;