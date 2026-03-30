const express = require("express");
const router = express.Router();

const retailerController = require("../controllers/retailerController");
const { verifyToken } = require("../middleware/authMiddleware");

// ===== RETAILER ROUTES =====

// CREATE
router.post("/retailers", verifyToken, retailerController.create);

// LIST
router.get("/retailers", verifyToken, retailerController.list);

// UPDATE
router.put("/retailers/:id", verifyToken, retailerController.update);

// DELETE
router.delete("/retailers/:id", verifyToken, retailerController.remove);

module.exports = router;