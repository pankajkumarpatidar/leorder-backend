const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// 🔥 REGISTER USER (ADMIN ONLY)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, ref_id } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password, role required"
      });
    }

    // 🔹 check existing
    const existing = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, ref_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, email, hashedPassword, role, ref_id]
    );

    res.json({
      message: "User created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
};



// 🔥 LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid email"
      });
    }

    const user = result.rows[0];

    // 🔐 compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    // 🔐 token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        ref_id: user.ref_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Login success",
      token,
      user: {
        id: user.id,
        role: user.role,
        ref_id: user.ref_id,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
};