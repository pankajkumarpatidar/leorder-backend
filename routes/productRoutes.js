const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const auth = require("../middleware/auth");

router.post("/products", auth, productController.create);
router.get("/products", auth, productController.list);
router.put("/products/:id", auth, productController.update);
router.delete("/products/:id", auth, productController.remove);

module.exports = router;