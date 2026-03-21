const express = require('express');
const router = express.Router();

const controller = require('../controllers/worksheetController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE (SALESMAN)
router.post(
  '/create',
  verifyToken,
  checkRole('salesman'),
  controller.create
);


// 🔥 LIST (ADMIN + STAFF)
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);


// 🔥 SALESMAN OWN DATA
router.get(
  '/my',
  verifyToken,
  checkRole('salesman'),
  controller.myData
);


// 🔥 CONVERT TO LEAD
router.post(
  '/convert',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.convertToLead
);


module.exports = router;