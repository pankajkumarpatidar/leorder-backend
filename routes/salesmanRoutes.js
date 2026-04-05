const express = require("express");
const router = express.Router();

const s = require("../controllers/salesmanController");
const { verifyToken } = require("../middleware/authMiddleware");

// CRUD
router.post("/", verifyToken, s.create);
router.get("/", verifyToken, s.list);
router.put("/:id", verifyToken, s.update);

// status
router.put("/toggle/:id", verifyToken, s.toggleStatus);

// brand assign
router.post("/assign-brands", verifyToken, s.assignBrands);
router.get("/brands/:id", verifyToken, s.getBrands);

// performance
router.get("/performance/:id", verifyToken, s.performance);

module.exports = router;
