const express = require('express');
const router = express.Router();

const controller = require('../controllers/retailerController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE
router.post(
  '/create',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.create
);


// 🔥 LIST
router.get(
  '/list',
  verifyToken,
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
  checkRole('admin', 'staff'),
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