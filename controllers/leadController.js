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

    const r = await pool.query(
      `INSERT INTO leads
      (business_name,mobile,email,gst_status,gst_no,address,pincode,
       distributor_id,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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

    res.json({ success: true, data: r.rows[0] });

  } catch (e) {
    console.log("CREATE LEAD ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};


// ================= LIST =================
exports.list = async (req, res) => {
  try {
    let query = `
      SELECT *
      FROM leads
      WHERE distributor_id=$1
    `;

    const values = [req.user.distributor_id];
    let i = 2;

    // 🔒 SALESMAN
    if (req.user.role === "salesman") {
      query += ` AND created_by=$${i++}`;
      values.push(req.user.id);
    }

    query += ` ORDER BY id DESC`;

    const r = await pool.query(query, values);

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    console.log("LIST LEAD ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
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

    // 🔥 CREATE RETAILER FROM LEAD
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
    res.status(500).json({ success: false, message: e.message });
  } finally {
    client.release();
  }
};


// ================= DELETE =================
exports.remove = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM leads WHERE id=$1`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (e) {
    console.log("DELETE LEAD ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};
