const express = require("express");
const router = express.Router();

const auth = require("../controllers/authController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// PUBLIC
router.post("/register", auth.register);
router.post("/login", auth.login);

// PRIVATE (ADMIN ONLY)
router.post(
  "/create-user",
  verifyToken,
  checkRole("admin"),
  auth.createUser
);

module.exports = router;