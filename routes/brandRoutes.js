const express = require("express");
const router = express.Router();

const brand = require("../controllers/brand.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.post("/create", brand.create);
router.get("/list", brand.list);
router.get("/:id", brand.getOne);
router.put("/:id", brand.update);
router.delete("/:id", brand.delete);

module.exports = router;