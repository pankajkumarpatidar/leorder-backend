const pool = require('../config/db');


// 🔥 CREATE RETAILER (ADMIN + STAFF)
exports.create = async (req, res) => {
  try {
    const {
      firm_name,
      owner_name,
      mobile,
      email,
      address,
      gst_no,
      account_type,
      credit_limit,
      credit_days
    } = req.body;

    if (!firm_name || !mobile || !email) {
      return res.status(400).json({
        message: "Firm name, mobile, email required"
      });
    }

    // 🔹 Check duplicate mobile
    const existing = await pool.query(
      `SELECT * FROM retailers WHERE mobile=$1`,
      [mobile]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Retailer already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO retailers
      (firm_name, owner_name, mobile, email, address, gst_no, account_type, credit_limit, credit_days, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        firm_name,
        owner_name,
        mobile,
        email,
        address,
        gst_no,
        account_type,
        credit_limit || 0,
        credit_days || 0,
        'active'
      ]
    );

    res.json({
      message: "Retailer created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating retailer");
  }
};



// 🔥 LIST RETAILERS (ADMIN + STAFF)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM retailers ORDER BY id DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error fetching retailers");
  }
};



// 🔥 GET SINGLE RETAILER
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM retailers WHERE id=$1`,
      [id]
    );

    const retailer = result.rows[0];

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    // 🔥 Retailer restriction
    if (req.user.role === 'retailer') {
      if (req.user.ref_id !== retailer.id) {
        return res.status(403).json({
          message: "Access denied"
        });
      }
    }

    res.json(retailer);

  } catch (err) {
    res.status(500).send("Error");
  }
};



// 🔥 UPDATE RETAILER
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firm_name,
      owner_name,
      address,
      gst_no,
      account_type,
      credit_limit,
      credit_days,
      status
    } = req.body;

    await pool.query(
      `UPDATE retailers SET
        firm_name=$1,
        owner_name=$2,
        address=$3,
        gst_no=$4,
        account_type=$5,
        credit_limit=$6,
        credit_days=$7,
        status=$8
       WHERE id=$9`,
      [
        firm_name,
        owner_name,
        address,
        gst_no,
        account_type,
        credit_limit,
        credit_days,
        status,
        id
      ]
    );

    res.json({ message: "Retailer updated" });

  } catch (err) {
    res.status(500).send("Error updating retailer");
  }
};



// 🔥 DELETE RETAILER (OPTIONAL)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM retailers WHERE id=$1`,
      [id]
    );

    res.json({ message: "Retailer deleted" });

  } catch (err) {
    res.status(500).send("Error deleting retailer");
  }
};