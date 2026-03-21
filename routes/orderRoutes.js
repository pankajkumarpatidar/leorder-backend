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
// ✔ Only Admin + Staff
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);


// 🔥 GET SINGLE ORDER
// ✔ All (लेकिन retailer restriction controller में)
router.get(
  '/:id',
  verifyToken,
  controller.getOne
);


// 🔥 UPDATE STATUS
// ✔ Only Admin + Staff
router.post(
  '/status',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.updateStatus
);


module.exports = router;