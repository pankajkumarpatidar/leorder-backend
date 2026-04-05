const express = require("express");
const router = express.Router();

const category = require("../controllers/categoryController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, category.create);
router.get("/", verifyToken, category.list);
router.put("/:id", verifyToken, category.update);
router.delete("/:id", verifyToken, category.remove);

module.exports = router;
