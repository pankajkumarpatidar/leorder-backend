const router = require("express").Router();
const ctrl = require("../controllers/leadController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, ctrl.list);
router.post("/", verifyToken, ctrl.create);
router.put("/status", verifyToken, ctrl.updateStatus);

module.exports = router;