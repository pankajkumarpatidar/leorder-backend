const express = require('express');
const router = express.Router();

const controller = require('../controllers/salesmanController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE (ADMIN ONLY)
router.post(
  '/create',
  verifyToken,
  checkRole('admin'),
  controller.create
);


// 🔥 LIST
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.list
);


// 🔥 GET ONE
router.get(
  '/:id',
  verifyToken,
  controller.getOne
);


// 🔥 UPDATE
router.put(
  '/:id',
  verifyToken,
  checkRole('admin'),
  controller.update
);


// 🔥 DELETE
router.delete(
  '/:id',
  verifyToken,
  checkRole('admin'),
  controller.delete
);


module.exports = router;