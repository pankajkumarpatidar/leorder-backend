const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// ================= REGISTER (DISTRIBUTOR + ADMIN) =================
exports.register = async (req, res) => {
  try {
    const {
      business_name,
      person_name,
      email,
      password,
      mobile,
      gst_no,
      address
    } = req.body;

    if (!business_name || !person_name || !email || !password) {
      return res.json({
        success: false,
        message: "All required fields missing"
      });
    }

    // 🔹 check existing
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

    // 🔥 CREATE DISTRIBUTOR
    const dist = await pool.query(
      `INSERT INTO distributors 
      (business_name, person_name, email, mobile, gst_no, address)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        business_name,
        person_name,
        email,
        mobile || "",
        gst_no || "",
        address || ""
      ]
    );

    const distributor_id = dist.rows[0].id;

    // 🔥 CREATE ADMIN USER
    const userRes = await pool.query(
      `INSERT INTO users 
      (name,email,password,role,distributor_id)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [person_name, email, hashed, "admin", distributor_id]
    );

    const user = userRes.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        distributor_id: user.distributor_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Account created",
      token,
      user
    });

  } catch (err) {
    console.error("REGISTER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({
        success: false,
        message: "Wrong password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        distributor_id: user.distributor_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user
    });

  } catch (err) {
    console.error("LOGIN ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= CREATE USER (STAFF / SALESMAN) =================
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.json({
        success: false,
        message: "All fields required"
      });
    }

    if (!["staff", "salesman"].includes(role)) {
      return res.json({
        success: false,
        message: "Invalid role"
      });
    }

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

    await pool.query(
      `INSERT INTO users 
      (name,email,password,role,distributor_id)
      VALUES ($1,$2,$3,$4,$5)`,
      [
        name,
        email,
        hashed,
        role,
        req.user.distributor_id
      ]
    );

    res.json({
      success: true,
      message: "User created"
    });

  } catch (err) {
    console.error("CREATE USER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};