const express = require("express");
const router = express.Router();

const staff = require("../controllers/staffController");
const { verifyToken } = require("../middleware/authMiddleware");

// salesman
router.post("/salesman", verifyToken, staff.createSalesman);

// lead
router.put("/lead/approve/:id", verifyToken, staff.approveLead);

// brand assign
router.post("/assign-brands", verifyToken, staff.assignBrands);

// order approve
router.put("/order/approve/:id", verifyToken, staff.approveOrder);

// dashboard
router.get("/dashboard", verifyToken, staff.dashboard);

// salesman list
router.get("/salesman", verifyToken, staff.salesmanList);

module.exports = router;
