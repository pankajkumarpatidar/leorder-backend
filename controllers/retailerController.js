const pool = require("../config/db");

// ================= LIST =================
exports.list = async (req, res) => {
  try {
    let query = `
      SELECT *
      FROM retailers
      WHERE distributor_id=$1
    `;

    const values = [req.user.distributor_id];
    let i = 2;

    // 🔒 SALESMAN → only own retailers
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
    console.log("LIST RETAILER ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= CREATE (LIMITED USE) =================
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
    const {
      business_name,
      mobile,
      email,
      gst_status,
      gst_no,
      address,
      pincode,
    } = req.body;

    // 🔥 ORDER APPROVED → LOCK (optional future)
    // अभी skip

    await pool.query(
      `UPDATE retailers SET
        business_name=$1,
        mobile=$2,
        email=$3,
        gst_status=$4,
        gst_no=$5,
        address=$6,
        pincode=$7
       WHERE id=$8 AND distributor_id=$9`,
      [
        business_name,
        mobile,
        email || null,
        gst_status,
        gst_status === "REGISTERED" ? gst_no : null,
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


// ================= DELETE =================
exports.remove = async (req, res) => {
  try {
    // 🔒 SALESMAN restriction
    if (req.user.role === "salesman") {
      const r = await pool.query(
        `SELECT created_by FROM retailers WHERE id=$1`,
        [req.params.id]
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
