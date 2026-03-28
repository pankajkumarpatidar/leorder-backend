const router = require("express").Router();
const ctrl = require("../controllers/orderController");
const {verifyToken}=require("../middleware/authMiddleware");
router.post("/",verifyToken,ctrl.create);
module.exports = router;
