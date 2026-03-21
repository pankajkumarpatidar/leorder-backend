const express = require('express');
const router = express.Router();

const controller = require('../controllers/leadController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE (SALESMAN ONLY)
router.post(
  '/create',
  verifyToken,
  checkRole('salesman'),
  controller.create
);


// 🔥 ADMIN + STAFF LIST
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);


// 🔥 SALESMAN OWN LEADS
router.get(
  '/my',
  verifyToken,
  checkRole('salesman'),
  controller.myLeads
);


// 🔥 APPROVE / REJECT
router.post(
  '/update-status',
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