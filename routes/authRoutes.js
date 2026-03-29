const router = require("express").Router();
const ctrl = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// ===== AUTH =====

// REGISTER (Distributor + Admin)
router.post("/register", ctrl.register);

// LOGIN
router.post("/login", ctrl.login);


// ===== USER (ADMIN CONTROL) =====

// CREATE USER (ONLY ADMIN)
router.post("/create-user", verifyToken, ctrl.createUser);


module.exports = router;