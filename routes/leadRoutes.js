const express = require("express");
const router = express.Router();

const lead = require("../controllers/lead.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// CREATE
router.post("/create", lead.create);

// LIST
router.get("/list", lead.list);
router.get("/my", lead.myLeads);

// 🔥 FIXED (body based, NOT param)
router.put("/status", lead.updateStatus);

// CONVERT
router.post("/convert", lead.convertToRetailer);

module.exports = router;