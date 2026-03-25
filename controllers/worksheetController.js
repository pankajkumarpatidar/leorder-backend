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
    res.status(500).json({ success: false });
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
      data: result.rows
    });

  } catch (err) {
    console.error("LIST WORKSHEET ERROR ❌", err);
    res.status(500).json({ success: false });
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
      data: result.rows
    });

  } catch (err) {
    console.error("MY WORK ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    const result = await pool.query(
      `UPDATE worksheets 
       SET status=$1
       WHERE id=$2 AND distributor_id=$3
       RETURNING *`,
      [status, id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Status updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("STATUS ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= CONVERT TO LEAD =================
exports.convertToLead = async (req, res) => {
  try {
    const { worksheet_id, brand_id } = req.body;

    const distributor_id = req.user.distributor_id;

    // 🔹 get worksheet
    const wsRes = await pool.query(
      `SELECT * FROM worksheets 
       WHERE id=$1 AND distributor_id=$2`,
      [worksheet_id, distributor_id]
    );

    if (wsRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Worksheet not found"
      });
    }

    const ws = wsRes.rows[0];

    // 🔹 check duplicate lead
    const existing = await pool.query(
      `SELECT * FROM leads 
       WHERE mobile=$1 AND distributor_id=$2`,
      [ws.mobile, distributor_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Lead already exists"
      });
    }

    const lead = await pool.query(
      `INSERT INTO leads 
      (mobile, brand_id, salesman_id, distributor_id, status)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        ws.mobile,
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
    res.status(500).json({ success: false });
  }
};