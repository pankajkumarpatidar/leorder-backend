const express = require("express");
const router = express.Router();

const controller = require("../controllers/retailerController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, controller.create);
router.get("/", verifyToken, controller.list);
router.put("/:id", verifyToken, controller.update);
router.delete("/:id", verifyToken, controller.remove);

module.exports = router;
