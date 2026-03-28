const router = require("express").Router();
const ctrl = require("../controllers/worksheetController");
const {verifyToken}=require("../middleware/authMiddleware");
router.get("/",verifyToken,ctrl.list);
router.post("/",verifyToken,ctrl.create);
module.exports = router;
