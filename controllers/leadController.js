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

    await pool.query(
      `INSERT INTO leads 
      (mobile, brand_id, retailer_id, distributor_id, status)
      VALUES ($1,$2,$3,$4,'pending')`,
      [
        mobile,
        brand_id,
        retailer_id || null,
        req.user.distributor_id, // 🔥 IMPORTANT
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

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Id & status required",
      });
    }

    await pool.query(
      `UPDATE leads 
       SET status=$1 
       WHERE id=$2 AND distributor_id=$3`,
      [status, id, req.user.distributor_id]
    );

    res.json({ success: true, message: "Status updated" });

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};