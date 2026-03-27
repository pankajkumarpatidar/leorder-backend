const pool = require('../config/db');


// ================= CREATE RETAILER =================
exports.create = async (req, res) => {
  try {
    const {
      business_name,
      email,
      mobile,
      gst_no,
      address,
      pincode
    } = req.body;

    // ✅ ROLE CHECK (ADMIN + STAFF)
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    // ✅ VALIDATION
    if (!business_name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Business name & mobile required"
      });
    }

    const cleanName = business_name.trim();

    // 🔹 DUPLICATE CHECK
    const existing = await pool.query(
      `SELECT id FROM retailers 
       WHERE mobile=$1 AND distributor_id=$2`,
      [mobile, req.user.distributor_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Retailer already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO retailers 
      (business_name, email, mobile, gst_no, address, pincode, distributor_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        cleanName,
        email || "",
        mobile,
        gst_no || "",
        address || "",
        pincode || "",
        req.user.distributor_id
      ]
    );

    res.json({
      success: true,
      message: "Retailer created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("CREATE RETAILER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= LIST RETAILERS =================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM retailers 
       WHERE distributor_id=$1
       ORDER BY id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("LIST RETAILER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= GET ONE =================
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM retailers 
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error("GET RETAILER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= UPDATE =================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      business_name,
      email,
      mobile,
      gst_no,
      address,
      pincode
    } = req.body;

    // ✅ ROLE CHECK
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Retailer id required"
      });
    }

    const result = await pool.query(
      `UPDATE retailers 
       SET 
         business_name=$1,
         email=$2,
         mobile=$3,
         gst_no=$4,
         address=$5,
         pincode=$6
       WHERE id=$7 AND distributor_id=$8
       RETURNING *`,
      [
        business_name?.trim() || "",
        email || "",
        mobile,
        gst_no || "",
        address || "",
        pincode || "",
        id,
        req.user.distributor_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Retailer updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("UPDATE RETAILER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= DELETE =================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ ROLE CHECK (ADMIN ONLY)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete retailer"
      });
    }

    const result = await pool.query(
      `DELETE FROM retailers 
       WHERE id=$1 AND distributor_id=$2
       RETURNING *`,
      [id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Retailer deleted"
    });

  } catch (err) {
    console.error("DELETE RETAILER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};