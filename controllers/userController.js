// ===== FILE: userController.js =====

const pool = require("../config/db");
const bcrypt = require("bcrypt");

// ================= CREATE USER =================
exports.create = async (req, res) => {
  try {
    const { name, email, password, role, mobile } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    // 🔒 ROLE CONTROL
    if (req.user.role === "staff" && role !== "salesman") {
      return res.status(403).json({
        success: false,
        message: "Staff can create only salesman",
      });
    }

    if (req.user.role === "salesman") {
      return res.status(403).json({
        success: false,
        message: "Salesman cannot create users",
      });
    }

    const exist = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (exist.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Email exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const r = await pool.query(
      `INSERT INTO users
      (name,email,password,role,distributor_id,created_by,mobile)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id,name,email,role,mobile`,
      [
        name,
        email,
        hashed,
        role,
        req.user.distributor_id,
        req.user.id,
        mobile || "",
      ]
    );

    res.json({
      success: true,
      data: r.rows[0],
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= LIST USERS =================
exports.list = async (req, res) => {
  try {
    let query = `
      SELECT id,name,email,role,mobile,is_active,created_at
      FROM users
      WHERE distributor_id=$1
    `;

    const values = [req.user.distributor_id];

    // 🔥 STAFF → only salesman
    if (req.user.role === "staff") {
      query += ` AND role='salesman'`;
    }

    query += ` ORDER BY id DESC`;

    const r = await pool.query(query, values);

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= ASSIGN BRAND + CATEGORY (COMBINED) =================
exports.assignAccess = async (req, res) => {
  try {
    const { user_id, access } = req.body;
    // access = [{ brand_id, category_id }]

    if (!user_id || !access?.length) {
      return res.status(400).json({
        success: false,
        message: "User & access required",
      });
    }

    // 🔒 ONLY ADMIN / STAFF
    if (req.user.role === "salesman") {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    // 🔥 CLEAR OLD
    await pool.query(
      `DELETE FROM user_brands WHERE user_id=$1`,
      [user_id]
    );

    // 🔥 INSERT NEW
    for (const a of access) {
      await pool.query(
        `INSERT INTO user_brands
        (user_id,brand_id,category_id)
        VALUES ($1,$2,$3)`,
        [user_id, a.brand_id, a.category_id || null]
      );
    }

    // 🔥 CATEGORY RESTRICTION FLAG
    await pool.query(
      `UPDATE users SET is_category_restricted=true WHERE id=$1`,
      [user_id]
    );

    res.json({
      success: true,
      message: "Access assigned",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= CLEAR ACCESS =================
exports.clearAccess = async (req, res) => {
  try {
    const { user_id } = req.body;

    await pool.query(
      `DELETE FROM user_brands WHERE user_id=$1`,
      [user_id]
    );

    await pool.query(
      `UPDATE users SET is_category_restricted=false WHERE id=$1`,
      [user_id]
    );

    res.json({
      success: true,
      message: "Full access restored",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= TOGGLE USER =================
exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE users SET is_active = NOT is_active WHERE id=$1`,
      [id]
    );

    res.json({
      success: true,
      message: "User status updated",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= USER DETAILS =================
exports.details = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pool.query(
      `SELECT id,name,email,role,mobile,is_active,is_category_restricted
       FROM users
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    if (!user.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔥 ACCESS (ONLY SALESMAN)
    let access = [];

    if (user.rows[0].role === "salesman") {
      const r = await pool.query(
        `SELECT ub.*, b.name AS brand_name
         FROM user_brands ub
         LEFT JOIN brands b ON b.id = ub.brand_id
         WHERE ub.user_id=$1`,
        [id]
      );

      access = r.rows;
    }

    res.json({
      success: true,
      data: {
        user: user.rows[0],
        access,
      },
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
