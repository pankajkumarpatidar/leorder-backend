const express = require("express");
const router = express.Router();

const worksheet = require("../controllers/worksheet.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.post("/create", worksheet.create);

router.get("/list", worksheet.list);
router.get("/my", worksheet.myData);

router.put("/status", worksheet.updateStatus);

router.post("/convert", worksheet.convertToLead);

module.exports = router;