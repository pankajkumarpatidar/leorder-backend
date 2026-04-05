const express = require("express");
const router = express.Router();

const ws = require("../controllers/worksheetController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, ws.create);
router.get("/", verifyToken, ws.list);
router.get("/:id", verifyToken, ws.details);
router.delete("/:id", verifyToken, ws.remove);

module.exports = router;
