const express = require('express');
const router = express.Router();

const controller = require('../controllers/leadController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE (SALESMAN)
router.post(
  '/create',
  verifyToken,
  checkRole('salesman'),
  controller.create
);


// 🔥 ALL LEADS
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);


// 🔥 MY LEADS
router.get(
  '/my',
  verifyToken,
  checkRole('salesman'),
  controller.myLeads
);


// 🔥 UPDATE STATUS
router.post(
  '/status',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.updateStatus
);


// 🔥 CONVERT
router.post(
  '/convert',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.convertToRetailer
);

module.exports = router;