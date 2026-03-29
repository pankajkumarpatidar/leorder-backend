const pool = require("../config/db");

// ===== LIST =====
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leads 
       WHERE distributor_id=$1 
       ORDER BY id DESC`,
      [req.user.distributor_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log("LIST ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== CREATE =====
exports.create = async (req, res) => {
  try {
    const { mobile, brand_id, retailer_id } = req.body;

    if (!mobile || !brand_id) {
      return res.status(400).json({
        success: false,
        message: "Mobile & Brand required",
      });
    }

    // ✅ salesman id auto assign
    const salesman_id =
      req.user.role === "salesman" ? req.user.id : null;

    await pool.query(
      `INSERT INTO leads 
      (mobile, brand_id, retailer_id, distributor_id, salesman_id, status)
      VALUES ($1,$2,$3,$4,$5,'pending')`,
      [
        mobile,
        brand_id,
        retailer_id || null,
        req.user.distributor_id,
        salesman_id,
      ]
    );

    res.json({ success: true, message: "Lead created" });

  } catch (err) {
    console.log("CREATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== UPDATE STATUS =====
exports.updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    // ✅ VALIDATION
    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Id & status required",
      });
    }

    // ✅ ALLOWED STATUS ONLY
    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // ✅ EXTRA SECURITY (double check)
    if (req.user.role === "salesman") {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const result = await pool.query(
      `UPDATE leads 
       SET status=$1 
       WHERE id=$2 AND distributor_id=$3`,
      [status, id, req.user.distributor_id]
    );

    // ✅ if id not found
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({ success: true, message: "Status updated" });

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};