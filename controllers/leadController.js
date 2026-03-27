const pool = require('../config/db');


// ================= CREATE LEAD =================
exports.create = async (req, res) => {
  try {
    const { mobile, brand_id } = req.body;

    // ✅ ROLE CHECK (ONLY SALESMAN)
    if (req.user.role !== "salesman") {
      return res.status(403).json({
        success: false,
        message: "Only salesman can create lead"
      });
    }

    // ✅ VALIDATION
    if (!mobile || !brand_id) {
      return res.status(400).json({
        success: false,
        message: "Mobile & brand required"
      });
    }

    const distributor_id = req.user.distributor_id;
    const salesman_id = req.user.id;

    // 🔹 DUPLICATE CHECK (FIXED 🔥)
    const existing = await pool.query(
      `SELECT id FROM leads 
       WHERE mobile=$1 AND brand_id=$2 AND distributor_id=$3`,
      [mobile, brand_id, distributor_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Lead already exists for this brand"
      });
    }

    const result = await pool.query(
      `INSERT INTO leads 
      (mobile, brand_id, salesman_id, distributor_id, status)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        mobile,
        brand_id,
        salesman_id,
        distributor_id,
        "new"
      ]
    );

    res.json({
      success: true,
      message: "Lead created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("CREATE LEAD ERROR ❌", err);
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
      `SELECT l.*, b.name AS brand_name
       FROM leads l
       LEFT JOIN brands b ON l.brand_id = b.id
       WHERE l.distributor_id=$1
       ORDER BY l.id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("LIST LEAD ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= MY LEADS =================
exports.myLeads = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leads 
       WHERE salesman_id=$1 AND distributor_id=$2
       ORDER BY id DESC`,
      [req.user.id, req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("MY LEADS ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const { lead_id, status } = req.body;

    // ✅ ROLE CHECK (ADMIN / STAFF ONLY)
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    if (!lead_id || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid data"
      });
    }

    const result = await pool.query(
      `UPDATE leads 
       SET status=$1
       WHERE id=$2 AND distributor_id=$3
       RETURNING *`,
      [status, lead_id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    res.json({
      success: true,
      message: `Lead ${status}`,
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



// ================= CONVERT TO RETAILER =================
exports.convertToRetailer = async (req, res) => {
  try {
    const {
      lead_id,
      business_name,
      email,
      address,
      gst_no,
      pincode
    } = req.body;

    // ✅ ROLE CHECK
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    const distributor_id = req.user.distributor_id;

    // 🔹 GET LEAD
    const leadRes = await pool.query(
      `SELECT * FROM leads 
       WHERE id=$1 AND distributor_id=$2`,
      [lead_id, distributor_id]
    );

    if (leadRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    const lead = leadRes.rows[0];

    if (lead.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Lead not approved"
      });
    }

    // 🔹 CHECK RETAILER DUPLICATE
    const existing = await pool.query(
      `SELECT id FROM retailers 
       WHERE mobile=$1 AND distributor_id=$2`,
      [lead.mobile, distributor_id]
    );

    let retailer;

    if (existing.rows.length > 0) {
      retailer = existing.rows[0];
    } else {
      const newRetailer = await pool.query(
        `INSERT INTO retailers 
        (business_name, email, mobile, gst_no, address, pincode, distributor_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          business_name || "",
          email || "",
          lead.mobile,
          gst_no || "",
          address || "",
          pincode || "",
          distributor_id
        ]
      );

      retailer = newRetailer.rows[0];
    }

    // 🔹 UPDATE LEAD
    await pool.query(
      `UPDATE leads SET status='converted' WHERE id=$1`,
      [lead_id]
    );

    res.json({
      success: true,
      message: "Converted to retailer",
      retailer_id: retailer.id
    });

  } catch (err) {
    console.error("CONVERT ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};