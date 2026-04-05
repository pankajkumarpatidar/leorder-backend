// ===== FILE: leadController.js =====

const pool = require("../config/db");

// ================= CREATE LEAD =================
exports.create = async (req, res) => {
  try {
    const {
      business_name,
      mobile,
      email,
      gst_status,
      gst_no,
      address,
      pincode,
    } = req.body;

    if (!business_name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Business name & mobile required",
      });
    }

    // 🔥 DUPLICATE CHECK
    const exist = await pool.query(
      `SELECT id FROM leads 
       WHERE mobile=$1 AND distributor_id=$2`,
      [mobile, req.user.distributor_id]
    );

    if (exist.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Lead already exists",
      });
    }

    const r = await pool.query(
      `INSERT INTO leads
      (business_name,mobile,email,gst_status,gst_no,address,pincode,
       distributor_id,created_by,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
      RETURNING *`,
      [
        business_name,
        mobile,
        email || null,
        gst_status || "UNREGISTERED",
        gst_no || null,
        address || null,
        pincode || null,
        req.user.distributor_id,
        req.user.id,
      ]
    );

    res.json({
      success: true,
      data: r.rows[0],
    });

  } catch (e) {
    console.log("CREATE LEAD ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= LIST =================
exports.list = async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT *
      FROM leads
      WHERE distributor_id=$1
    `;

    const values = [req.user.distributor_id];
    let i = 2;

    // 🔒 SALESMAN → OWN LEADS ONLY
    if (req.user.role === "salesman") {
      query += ` AND created_by=$${i++}`;
      values.push(req.user.id);
    }

    // 🔍 SEARCH
    if (search) {
      query += ` AND (
        LOWER(business_name) LIKE LOWER($${i})
        OR mobile LIKE $${i}
      )`;
      values.push(`%${search}%`);
      i++;
    }

    // 🔍 STATUS FILTER
    if (status) {
      query += ` AND status=$${i++}`;
      values.push(status);
    }

    query += ` ORDER BY id DESC`;

    const r = await pool.query(query, values);

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    console.log("LIST LEAD ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= APPROVE LEAD =================
exports.approve = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    await client.query("BEGIN");

    // 🔥 GET LEAD
    const lead = await client.query(
      `SELECT * FROM leads WHERE id=$1`,
      [id]
    );

    if (!lead.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const l = lead.rows[0];

    // ❌ ALREADY APPROVED
    if (l.status === "approved") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Already approved",
      });
    }

    // 🔥 CHECK RETAILER EXISTS
    const existRetailer = await client.query(
      `SELECT id FROM retailers 
       WHERE mobile=$1 AND distributor_id=$2`,
      [l.mobile, l.distributor_id]
    );

    if (existRetailer.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Retailer already exists",
      });
    }

    // 🔥 CREATE RETAILER
    await client.query(
      `INSERT INTO retailers
      (business_name,email,mobile,gst_status,gst_no,address,pincode,
       distributor_id,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        l.business_name,
        l.email,
        l.mobile,
        l.gst_status,
        l.gst_no,
        l.address,
        l.pincode,
        l.distributor_id,
        l.created_by,
      ]
    );

    // 🔥 UPDATE LEAD
    await client.query(
      `UPDATE leads SET
        status='approved',
        approved_by=$1,
        approved_at=NOW()
       WHERE id=$2`,
      [req.user.id, id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Lead approved → Retailer created",
    });

  } catch (e) {
    await client.query("ROLLBACK");
    console.log("APPROVE LEAD ERROR:", e);

    res.status(500).json({
      success: false,
      message: e.message,
    });
  } finally {
    client.release();
  }
};


// ================= DELETE =================
exports.remove = async (req, res) => {
  try {
    // 🔒 ONLY ADMIN / STAFF
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    await pool.query(
      `DELETE FROM leads 
       WHERE id=$1 AND distributor_id=$2`,
      [req.params.id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Lead deleted",
    });

  } catch (e) {
    console.log("DELETE LEAD ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
