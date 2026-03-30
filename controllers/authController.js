const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ===== REGISTER =====
exports.register = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      business_name,
      person_name,
      email,
      password,
      mobile,
      gst_no,
      address,
    } = req.body;

    if (!business_name || !person_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields missing",
      });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    // CREATE DISTRIBUTOR
    const dist = await client.query(
      `INSERT INTO distributors 
      (business_name, person_name, email, mobile, gst_no, address)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id`,
      [
        business_name,
        person_name,
        email,
        mobile || "",
        gst_no || "",
        address || "",
      ]
    );

    const distributor_id = dist.rows[0].id;

    // CREATE ADMIN USER
    const userRes = await client.query(
      `INSERT INTO users 
      (name,email,password,role,distributor_id,mobile)
      VALUES ($1,$2,$3,'admin',$4,$5)
      RETURNING id,name,email,role,distributor_id,mobile`,
      [person_name, email, hashed, distributor_id, mobile || ""]
    );

    await client.query("COMMIT");

    const user = userRes.rows[0];

    // 🔥 IMPORTANT FIX
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        distributor_id: user.distributor_id,
        brand_ids: [],
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Account created",
      token,
      user,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    client.release();
  }
};


// ===== LOGIN =====
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Wrong password",
      });
    }

    delete user.password;

    // 🔥 BRAND IDS
    let brand_ids = [];

    if (user.role === "salesman") {
      const brands = await pool.query(
        `SELECT brand_id FROM user_brands WHERE user_id=$1`,
        [user.id]
      );

      brand_ids = brands.rows.map((b) => b.brand_id);
    }

    user.brand_ids = brand_ids;

    // 🔥 FINAL TOKEN FIX
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        distributor_id: user.distributor_id,
        brand_ids,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===== CREATE USER (ADMIN ONLY) =====
exports.createUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create users",
      });
    }

    const { name, email, password, role, mobile } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    if (!["staff", "salesman"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Email exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users 
      (name,email,password,role,distributor_id,mobile)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        name,
        email,
        hashed,
        role,
        req.user.distributor_id,
        mobile || "",
      ]
    );

    res.json({
      success: true,
      message: "User created successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};