// ===== FILE: retailerController.js =====

const pool = require("../config/db");


// ================= LIST =================
exports.list = async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT *
      FROM retailers
      WHERE distributor_id=$1
    `;

    const values = [req.user.distributor_id];
    let i = 2;

    // 🔍 SEARCH
    if (search) {
      query += ` AND (
        LOWER(business_name) LIKE LOWER($${i})
        OR mobile LIKE $${i}
      )`;
      values.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY id DESC`;

    const r = await pool.query(query, values);

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    console.log("LIST RETAILER ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= CREATE =================
// ⚠️ Prefer via Lead approval
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
    const ex = await pool.query(
      `SELECT id FROM retailers 
       WHERE mobile=$1 AND distributor_id=$2`,
      [mobile, req.user.distributor_id]
    );

    if (ex.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Retailer already exists",
      });
    }

    // 🔥 GST VALIDATION
    if (gst_status === "REGISTERED" && !gst_no) {
      return res.status(400).json({
        success: false,
        message: "GST No required",
      });
    }

    const r = await pool.query(
      `INSERT INTO retailers
      (business_name,email,mobile,gst_status,gst_no,address,pincode,
       distributor_id,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        business_name,
        email || null,
        mobile,
        gst_status || "UNREGISTERED",
        gst_status === "REGISTERED" ? gst_no : null,
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
    console.log("CREATE RETAILER ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= UPDATE =================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      business_name,
      mobile,
      email,
      gst_status,
      gst_no,
      address,
      pincode,
    } = req.body;

    // 🔒 SALESMAN → only own
    if (req.user.role === "salesman") {
      const r = await pool.query(
        `SELECT created_by FROM retailers WHERE id=$1`,
        [id]
      );

      if (r.rows[0]?.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not allowed",
        });
      }
    }

    // 🔥 GST VALIDATION
    if (gst_status === "REGISTERED" && !gst_no) {
      return res.status(400).json({
        success: false,
        message: "GST No required",
      });
    }

    await pool.query(
      `UPDATE retailers SET
        business_name = COALESCE($1,business_name),
        mobile = COALESCE($2,mobile),
        email = COALESCE($3,email),
        gst_status = COALESCE($4,gst_status),
        gst_no = CASE 
          WHEN $4='REGISTERED' THEN $5 
          ELSE NULL 
        END,
        address = COALESCE($6,address),
        pincode = COALESCE($7,pincode)
       WHERE id=$8 AND distributor_id=$9`,
      [
        business_name,
        mobile,
        email,
        gst_status,
        gst_no,
        address,
        pincode,
        id,
        req.user.distributor_id,
      ]
    );

    res.json({
      success: true,
      message: "Retailer updated",
    });

  } catch (e) {
    console.log("UPDATE RETAILER ERROR:", e);
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

    // 🔒 SALESMAN → only own
    if (req.user.role === "salesman") {
      const r = await pool.query(
        `SELECT created_by FROM retailers WHERE id=$1`,
        [id]
      );

      if (r.rows[0]?.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not allowed",
        });
      }
    }

    await pool.query(
      `DELETE FROM retailers 
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Retailer deleted",
    });

  } catch (e) {
    console.log("DELETE RETAILER ERROR:", e);
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
      `SELECT *
       FROM retailers
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    if (!r.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found",
      });
    }

    res.json({
      success: true,
      data: r.rows[0],
    });

  } catch (e) {
    console.log("DETAIL RETAILER ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
