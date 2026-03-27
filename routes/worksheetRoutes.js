const express = require("express");
const router = express.Router();

const worksheet = require("../controllers/worksheetController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, worksheet.create);
router.get("/", verifyToken, worksheet.list);
router.get("/my", verifyToken, worksheet.myData);
router.put("/status", verifyToken, worksheet.updateStatus);
router.post("/convert", verifyToken, worksheet.convertToLead);

module.exports = router;