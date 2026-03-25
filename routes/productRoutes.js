const express = require('express');
const router = express.Router();

const controller = require('../controllers/productController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE
router.post(
  '/create',
  verifyToken,
  checkRole('admin'),
  controller.create
);


// 🔥 UPDATE
router.put(
  '/update',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.update
);


// 🔥 LIST
router.get(
  '/list',
  verifyToken,
  controller.list
);


// 🔥 PRICE LIST
router.get(
  '/price-list/:brand_id',
  verifyToken,
  controller.priceList
);


// 🔥 EXCEL
router.get(
  '/price-list-excel/:brand_id',
  verifyToken,
  controller.priceListExcel
);

module.exports = router;