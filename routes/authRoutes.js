const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");

// PUBLIC
router.post("/register", auth.register);
router.post("/login", auth.login);

// PRIVATE
router.post("/create-user", verifyToken, checkRole("admin"), auth.createUser);

module.exports = router;