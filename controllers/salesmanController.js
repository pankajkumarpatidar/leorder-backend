const pool = require('../config/db');
const bcrypt = require('bcrypt');


// ================= CREATE SALESMAN =================
exports.create = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    // 🔹 duplicate check
    const existing = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users 
      (name, email, password, role, distributor_id, mobile)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        name,
        email,
        hashed,
        "salesman",
        req.user.distributor_id,
        mobile || ""
      ]
    );

    res.json({
      success: true,
      message: "Salesman created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("CREATE SALESMAN ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= LIST SALESMAN =================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, mobile 
       FROM users 
       WHERE role='salesman' AND distributor_id=$1
       ORDER BY id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("LIST SALESMAN ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= GET ONE =================
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, mobile 
       FROM users 
       WHERE id=$1 AND role='salesman' AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Salesman not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error("GET SALESMAN ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= UPDATE =================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name=$1, mobile=$2
       WHERE id=$3 AND role='salesman' AND distributor_id=$4
       RETURNING *`,
      [name, mobile, id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Salesman updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("UPDATE SALESMAN ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= DELETE =================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM users 
       WHERE id=$1 AND role='salesman' AND distributor_id=$2
       RETURNING *`,
      [id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Salesman deleted"
    });

  } catch (err) {
    console.error("DELETE SALESMAN ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};