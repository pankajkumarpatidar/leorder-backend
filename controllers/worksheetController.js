const pool = require("../config/db");

// ================= CREATE WORKSHEET =================
exports.create = async (req, res) => {
  try {
    const { mobile, notes } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile required",
      });
    }

    // 🔍 CHECK RETAILER
    const retailer = await pool.query(
      `SELECT id FROM retailers
       WHERE mobile=$1 AND distributor_id=$2`,
      [mobile, req.user.distributor_id]
    );

    let retailer_id = null;
    let lead_created = false;

    if (retailer.rows.length) {
      retailer_id = retailer.rows[0].id;
    } else {
      // 🔥 CREATE LEAD
      const lead = await pool.query(
        `INSERT INTO leads
        (mobile, distributor_id, created_by)
        VALUES ($1,$2,$3)
        RETURNING id`,
        [mobile, req.user.distributor_id, req.user.id]
      );

      retailer_id = null;
      lead_created = true;
    }

    // 🧾 SAVE WORKSHEET
    const ws = await pool.query(
      `INSERT INTO worksheets
      (user_id, distributor_id, mobile, notes)
      VALUES ($1,$2,$3,$4)
      RETURNING *`,
      [
        req.user.id,
        req.user.distributor_id,
        mobile,
        notes || "",
      ]
    );

    res.json({
      success: true,
      data: ws.rows[0],
      lead_created,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= LIST =================
exports.list = async (req, res) => {
  try {
    let query = `
      SELECT w.*, u.name as user_name
      FROM worksheets w
      JOIN users u ON u.id = w.user_id
      WHERE w.distributor_id = $1
    `;

    const values = [req.user.distributor_id];
    let i = 2;

    // 🔒 SALESMAN LIMIT
    if (req.user.role === "salesman") {
      query += ` AND w.user_id = $${i++}`;
      values.push(req.user.id);
    }

    query += ` ORDER BY w.id DESC`;

    const r = await pool.query(query, values);

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= DETAILS =================
exports.details = async (req, res) => {
  try {
    const { id } = req.params;

    const r = await pool.query(
      `SELECT w.*, u.name as user_name
       FROM worksheets w
       JOIN users u ON u.id = w.user_id
       WHERE w.id=$1`,
      [id]
    );

    res.json({
      success: true,
      data: r.rows[0],
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= DELETE =================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM worksheets WHERE id=$1`,
      [id]
    );

    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
