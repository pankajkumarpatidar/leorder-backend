const router = require("express").Router();
const ctrl = require("../controllers/userController");
const {verifyToken,checkRole}=require("../middleware/authMiddleware");
router.get("/",verifyToken,ctrl.list);
router.post("/",verifyToken,checkRole("admin"),ctrl.create);
module.exports = router;
