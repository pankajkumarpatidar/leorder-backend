const express = require("express");
const router = express.Router();

const brand = require("../controllers/brandController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, brand.create);
router.get("/", verifyToken, brand.list);
router.put("/:id", verifyToken, brand.update);
router.delete("/:id", verifyToken, brand.remove);

module.exports = router;
