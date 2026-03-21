const express = require('express');
const router = express.Router();

const controller = require('../controllers/productController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');


// 🔥 CREATE PRODUCT (ADMIN ONLY)
router.post(
  '/create',
  verifyToken,
  checkRole('admin'),
  controller.create
);


// 🔥 UPDATE PRODUCT (ADMIN + STAFF)
router.post(
  '/update',
  verifyToken,
  checkRole('admin', 'staff'),
  controller.update
);


// 🔹 LIST PRODUCTS (ALL LOGGED USERS)
router.get(
  '/list',
  verifyToken,
  controller.list
);


// 🔹 PRICE LIST (JSON)
router.get(
  '/price-list/:brand_id',
  verifyToken,
  controller.priceList
);


// 🔹 PRICE LIST PDF
router.get(
  '/price-list-pdf/:brand_id',
  verifyToken,
  controller.priceListPDF
);


// 🔥 PRICE LIST EXCEL
router.get(
  '/price-list-excel/:brand_id',
  verifyToken,
  controller.priceListExcel
);


// 🔥 WHATSAPP SHARE LINK
router.get(
  '/price-list-share/:brand_id',
  verifyToken,
  controller.sharePriceList
);


module.exports = router;