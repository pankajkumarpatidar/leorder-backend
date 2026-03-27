const pool = require('../config/db');


// ================= CREATE WORKSHEET =================
exports.create = async (req, res) => {
  try {
    const {
      retailer_id,
      visit_type,
      status,
      notes,
      next_action
    } = req.body;

    const user_id = req.user.id;
    const distributor_id = req.user.distributor_id;

    if (!visit_type) {
      return res.status(400).json({
        success: false,
        message: "Visit type required"
      });
    }

    // 🔹 retailer validation (optional but safe)
    if (retailer_id) {
      const checkRetailer = await pool.query(
        `SELECT id FROM retailers 
         WHERE id=$1 AND distributor_id=$2`,
        [retailer_id, distributor_id]
      );

      if (checkRetailer.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Retailer not found"
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO worksheets 
      (user_id, distributor_id, retailer_id, visit_type, status, notes, next_action)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        user_id,
        distributor_id,
        retailer_id || null,
        visit_type,
        status || "pending",
        notes || "",
        next_action || ""
      ]
    );

    res.json({
      success: true,
      message: "Worksheet created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("CREATE WORKSHEET ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= LIST ALL =================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, r.business_name AS retailer_name, u.name AS user_name
       FROM worksheets w
       LEFT JOIN retailers r ON w.retailer_id = r.id
       LEFT JOIN users u ON w.user_id = u.id
       WHERE w.distributor_id=$1
       ORDER BY w.id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("LIST WORKSHEET ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= MY DATA =================
exports.myData = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM worksheets 
       WHERE user_id=$1 AND distributor_id=$2
       ORDER BY id DESC`,
      [req.user.id, req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("MY WORK ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    // ✅ VALID STATUS
    if (!["pending", "done", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const result = await pool.query(
      `UPDATE worksheets 
       SET status=$1
       WHERE id=$2 AND distributor_id=$3
       RETURNING *`,
      [status, id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Worksheet not found"
      });
    }

    res.json({
      success: true,
      message: "Status updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("STATUS ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= CONVERT TO LEAD =================
exports.convertToLead = async (req, res) => {
  try {
    const { worksheet_id, brand_id } = req.body;

    const distributor_id = req.user.distributor_id;

    if (!worksheet_id || !brand_id) {
      return res.status(400).json({
        success: false,
        message: "Worksheet & brand required"
      });
    }

    // 🔹 get worksheet
    const wsRes = await pool.query(
      `SELECT * FROM worksheets 
       WHERE id=$1 AND distributor_id=$2`,
      [worksheet_id, distributor_id]
    );

    if (wsRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Worksheet not found"
      });
    }

    const ws = wsRes.rows[0];

    // ❗ IMPORTANT: mobile नहीं है worksheet में
    if (!ws.retailer_id) {
      return res.status(400).json({
        success: false,
        message: "Retailer required to convert lead"
      });
    }

    // 🔹 get retailer mobile
    const retailerRes = await pool.query(
      `SELECT mobile FROM retailers 
       WHERE id=$1 AND distributor_id=$2`,
      [ws.retailer_id, distributor_id]
    );

    if (retailerRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found"
      });
    }

    const mobile = retailerRes.rows[0].mobile;

    // 🔹 duplicate check
    const existing = await pool.query(
      `SELECT id FROM leads 
       WHERE mobile=$1 AND distributor_id=$2`,
      [mobile, distributor_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Lead already exists"
      });
    }

    const lead = await pool.query(
      `INSERT INTO leads 
      (mobile, brand_id, salesman_id, distributor_id, status)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        mobile,
        brand_id,
        ws.user_id,
        distributor_id,
        "new"
      ]
    );

    res.json({
      success: true,
      message: "Converted to lead",
      data: lead.rows[0]
    });

  } catch (err) {
    console.error("CONVERT ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};