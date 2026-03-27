const express = require("express");
const router = express.Router();

const lead = require("../controllers/leadController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, lead.create);
router.get("/list", verifyToken, lead.list);
router.get("/my", verifyToken, lead.myLeads);
router.put("/status", verifyToken, lead.updateStatus);
router.post("/convert", verifyToken, lead.convertToRetailer);

module.exports = router;