const express = require("express");
const router = express.Router();

const user = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, user.list);
router.get("/:id", verifyToken, user.details);

module.exports = router;
