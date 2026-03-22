const pool = require('../config/db');
const jwt = require('jsonwebtoken');


// ================= REGISTER (Distributor) =================
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check existing
    const checkUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (checkUser.rows.length > 0) {
      return res.json({
        success: false,
        message: "User already exists"
      });
    }

    // create distributor
    const newUser = await pool.query(
      `INSERT INTO users 
      (name, email, password, role, distributor_id) 
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, email, password, "admin", null]
    );

    const user = newUser.rows[0];

    // 🔥 distributor_id = own id
    await pool.query(
      "UPDATE users SET distributor_id = $1 WHERE id = $1",
      [user.id]
    );

    res.json({
      success: true,
      message: "Distributor registered successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    const dbUser = user.rows[0];

    // password check (simple)
    if (dbUser.password !== password) {
      return res.json({
        success: false,
        message: "Invalid password"
      });
    }

    // 🔥 distributor_id logic
    let distributor_id;

    if (dbUser.role === "admin") {
      distributor_id = dbUser.id;
    } else {
      distributor_id = dbUser.distributor_id;
    }

    // 🔐 token
    const token = jwt.sign(
      {
        id: dbUser.id,
        role: dbUser.role,
        distributor_id: distributor_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        distributor_id: distributor_id
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ================= CREATE USER =================
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ❌ only staff / salesman allowed
    if (!['staff', 'salesman'].includes(role)) {
      return res.json({
        success: false,
        message: "Invalid role"
      });
    }

    // check existing
    const check = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (check.rows.length > 0) {
      return res.json({
        success: false,
        message: "User already exists"
      });
    }

    // 🔥 create under distributor
    const newUser = await pool.query(
      `INSERT INTO users 
      (name, email, password, role, distributor_id, ref_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        name,
        email,
        password,
        role,
        req.user.distributor_id, // 🔥 same distributor
        req.user.id // 🔥 parent creator
      ]
    );

    res.json({
      success: true,
      message: `${role} created successfully`,
      data: newUser.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error creating user"
    });
  }
};