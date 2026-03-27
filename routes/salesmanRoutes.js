const express = require("express");
const router = express.Router();

const salesman = require("../controllers/salesman.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.post("/create", salesman.create);
router.get("/list", salesman.list);
router.get("/:id", salesman.getOne);
router.put("/:id", salesman.update);
router.delete("/:id", salesman.delete);

module.exports = router;