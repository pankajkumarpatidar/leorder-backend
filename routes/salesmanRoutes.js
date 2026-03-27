const express = require("express");
const router = express.Router();

const salesman = require("../controllers/salesmanController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, salesman.create);
router.get("/", verifyToken, salesman.list);
router.get("/:id", verifyToken, salesman.getOne);
router.put("/:id", verifyToken, salesman.update);
router.delete("/:id", verifyToken, salesman.delete);

module.exports = router;