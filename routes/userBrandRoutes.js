const express = require("express");
const router = express.Router();

const controller = require("../controllers/userBrandController");
const { verifyToken } = require("../middleware/authMiddleware");

// BASE: /api/user-brands

router.post("/assign", verifyToken, controller.assign);
router.get("/user/:user_id", verifyToken, controller.getUserBrands);
router.delete("/:id", verifyToken, controller.remove);
router.get("/my", verifyToken, controller.myBrands);

module.exports = router;
