const pool = require("../config/db");

// ===== LIST =====
exports.list = async (req, res) => {
  try {
    let result;

    // 🔥 SALESMAN → only his brands
    if (req.user.role === "salesman") {
      result = await pool.query(
        `SELECT * FROM leads
         WHERE distributor_id=$1
         AND brand_id = ANY($2)
         ORDER BY id DESC`,
        [req.user.distributor_id, req.user.brand_ids]
      );
    } else {
      // ✅ admin / staff
      result = await pool.query(
        `SELECT * FROM leads
         WHERE distributor_id=$1
         ORDER BY id DESC`,
        [req.user.distributor_id]
      );
    }

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

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile",
      });
    }

    // 🔥 SALESMAN BRAND VALIDATION
    if (req.user.role === "salesman") {
      if (!req.user.brand_ids.includes(Number(brand_id))) {
        return res.status(403).json({
          success: false,
          message: "Not allowed for this brand",
        });
      }
    }

    const exists = await pool.query(
      `SELECT id FROM leads 
       WHERE mobile=$1 AND distributor_id=$2`,
      [mobile, req.user.distributor_id]
    );

    if (exists.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Lead already exists",
      });
    }

    const salesman_id =
      req.user.role === "salesman" ? req.user.id : null;

    await pool.query(
      `INSERT INTO leads
      (mobile, brand_id, retailer_id, distributor_id, salesman_id, status)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        mobile,
        brand_id,
        retailer_id || null,
        req.user.distributor_id,
        salesman_id,
        "pending",
      ]
    );

    res.json({
      success: true,
      message: "Lead created",
    });

  } catch (err) {
    console.log("CREATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
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

    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (req.user.role === "salesman") {
      return res.status(403).json({
        success: false,
        message: "Salesman cannot change status",
      });
    }

    const result = await pool.query(
      `UPDATE leads
       SET status=$1
       WHERE id=$2 AND distributor_id=$3`,
      [status, id, req.user.distributor_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      message: "Status updated",
    });

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};