const express = require("express");
const router = express.Router();

const retailer = require("../controllers/retailerController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, retailer.create);
router.get("/", verifyToken, retailer.list);
router.get("/:id", verifyToken, retailer.getOne);
router.put("/:id", verifyToken, retailer.update);
router.delete("/:id", verifyToken, retailer.delete);

module.exports = router;