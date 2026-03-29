const router = require("express").Router();
const ctrl = require("../controllers/retailerController");
const { verifyToken } = require("../middleware/authMiddleware");

// LIST
router.get("/", verifyToken, ctrl.list);

// CREATE
router.post("/", verifyToken, ctrl.create);

// UPDATE
router.put("/:id", verifyToken, ctrl.update);

// DELETE
router.delete("/:id", verifyToken, ctrl.remove);

module.exports = router;