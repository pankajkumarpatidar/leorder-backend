const router = require("express").Router();
const ctrl = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

// USERS
router.get("/", verifyToken, ctrl.list);
router.get("/me", verifyToken, ctrl.me); // 🔥 ADD THIS

// CREATE
router.post("/create", verifyToken, ctrl.create);

// UPDATE
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { name, email, role, mobile } = req.body;

    await pool.query(
      `UPDATE users 
       SET name=$1,email=$2,role=$3,mobile=$4 
       WHERE id=$5 AND distributor_id=$6`,
      [name, email, role, mobile, req.params.id, req.user.distributor_id]
    );

    res.json({ success: true, message: "Updated" });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// DELETE
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM users 
       WHERE id=$1 AND distributor_id=$2`,
      [req.params.id, req.user.distributor_id]
    );

    res.json({ success: true, message: "Deleted" });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;