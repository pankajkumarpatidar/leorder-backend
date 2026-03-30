const pool = require("../config/db");

// ===== CREATE =====
exports.create = async (req, res) => {
  try {
    const {
      business_name,
      email,
      mobile,
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

    const r = await pool.query(
      `INSERT INTO retailers 
      (business_name,email,mobile,gst_no,address,pincode,distributor_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        business_name,
        email || null,
        mobile,
        gst_no || null,
        address || null,
        pincode || null,
        req.user.distributor_id,
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


// ===== LIST =====
exports.list = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT 
         id,
         business_name,
         email,
         mobile,
         gst_no,
         address,
         pincode,
         created_at
       FROM retailers 
       WHERE distributor_id=$1 
       ORDER BY id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      data: r.rows || [],
    });

  } catch (e) {
    console.log("LIST RETAILER ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ===== UPDATE =====
exports.update = async (req, res) => {
  try {
    const {
      business_name,
      email,
      mobile,
      gst_no,
      address,
      pincode,
    } = req.body;

    await pool.query(
      `UPDATE retailers SET
        business_name=$1,
        email=$2,
        mobile=$3,
        gst_no=$4,
        address=$5,
        pincode=$6
       WHERE id=$7 AND distributor_id=$8`,
      [
        business_name,
        email || null,
        mobile,
        gst_no || null,
        address || null,
        pincode || null,
        req.params.id,
        req.user.distributor_id,
      ]
    );

    res.json({
      success: true,
      message: "Updated",
    });

  } catch (e) {
    console.log("UPDATE RETAILER ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ===== DELETE =====
exports.remove = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM retailers 
       WHERE id=$1 AND distributor_id=$2`,
      [req.params.id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (e) {
    console.log("DELETE RETAILER ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};