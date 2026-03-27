const express = require("express");
const router = express.Router();

const retailer = require("../controllers/retailer.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.post("/create", retailer.create);
router.get("/list", retailer.list);
router.get("/:id", retailer.getOne);
router.put("/:id", retailer.update);
router.delete("/:id", retailer.delete);

module.exports = router;