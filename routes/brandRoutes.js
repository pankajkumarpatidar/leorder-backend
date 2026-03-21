const express = require('express');
const router = express.Router();

const controller = require('../controllers/brandController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// CREATE
router.post(
  '/create',
  verifyToken,
  checkRole('admin'),
  controller.create
);


// LIST
router.get(
  '/list',
  verifyToken,
  controller.list
);


// GET ONE
router.get(
  '/:id',
  verifyToken,
  controller.getOne
);


// UPDATE
router.put(
  '/:id',
  verifyToken,
  checkRole('admin'),
  controller.update
);


// DELETE
router.delete(
  '/:id',
  verifyToken,
  checkRole('admin'),
  controller.delete
);

module.exports = router;