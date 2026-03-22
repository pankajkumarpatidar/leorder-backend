const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// 🔥 REGISTER (Distributor Signup)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // basic validation
    if (!name || !email || !password) {
      return res.json({ success: false, message: "All fields required" });
    }

    // check existing user
    const existing = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.json({ success: false, message: "Email already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 create distributor (admin)
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, distributor_id)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING *`,
      [name, email, hashedPassword, 'admin']
    );

    const user = result.rows[0];

    // 🔥 distributor_id = self id
    await pool.query(
      "UPDATE users SET distributor_id = $1 WHERE id = $1",
      [user.id]
    );

    return res.json({
      success: true,
      message: "Account created successfully"
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};



// 🔥 LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    const user = result.rows[0];

    // check password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({
        success: false,
        message: "Invalid password"
      });
    }

    // create token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        distributor_id: user.distributor_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};



// 🔥 CREATE USER (Distributor → Staff / Salesman)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const distributor_id = req.user.distributor_id;

    if (!name || !email || !password || !role) {
      return res.json({ success: false, message: "All fields required" });
    }

    // check existing
    const exist = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (exist.rows.length > 0) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (name, email, password, role, distributor_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [name, email, hashed, role, distributor_id]
    );

    res.json({
      success: true,
      message: "User created"
    });

  } catch (err) {
    console.log("CREATE USER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};