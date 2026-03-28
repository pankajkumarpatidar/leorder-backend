const router = require("express").Router();
const ctrl = require("../controllers/retailerController");
const {verifyToken}=require("../middleware/authMiddleware");
router.get("/",verifyToken,ctrl.list);
router.post("/",verifyToken,ctrl.create);
module.exports = router;
