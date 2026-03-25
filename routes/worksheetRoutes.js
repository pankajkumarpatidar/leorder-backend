const express = require('express');
const router = express.Router();

const controller = require('../controllers/worksheetController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE
router.post(
  '/create',
  verifyToken,
  checkRole('salesman', 'staff'),
  controller.create
);


// 🔥 LIST
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);


// 🔥 MY DATA
router.get(
  '/my',
  verifyToken,
  checkRole('salesman'),
  controller.myData
);


// 🔥 UPDATE STATUS
router.post(
  '/status',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.updateStatus
);


// 🔥 CONVERT TO LEAD
router.post(
  '/convert',
  verifyToken,
  checkRole('salesman', 'staff'),
  controller.convertToLead
);

module.exports = router;