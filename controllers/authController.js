const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// ================= REGISTER =================
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

    // ✅ VALIDATION
    if (!business_name || !person_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields missing"
      });
    }

    // ✅ EMAIL FORMAT CHECK
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // ✅ PASSWORD LENGTH
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // 🔹 CHECK EXISTING
    const existing = await pool.query(
      `SELECT id FROM users WHERE email=$1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    // 🔥 TRANSACTION START
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 🔥 CREATE DISTRIBUTOR
      const dist = await client.query(
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
      const userRes = await client.query(
        `INSERT INTO users 
        (name,email,password,role,distributor_id)
        VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role,distributor_id`,
        [person_name, email, hashed, "admin", distributor_id]
      );

      await client.query("COMMIT");

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

      return res.json({
        success: true,
        message: "Account created",
        token,
        user
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

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

    // ✅ VALIDATION
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required"
      });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
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

    // ❌ password remove
    delete user.password;

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



// ================= CREATE USER =================
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ✅ ADMIN ONLY
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create users"
      });
    }

    // ✅ VALIDATION
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    if (!["staff", "salesman"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    const existing = await pool.query(
      `SELECT id FROM users WHERE email=$1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
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