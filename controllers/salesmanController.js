const pool = require("../config/db");
const bcrypt = require("bcrypt");

// ================= CREATE SALESMAN =================
exports.create = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin/staff allowed",
      });
    }

    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const exist = await pool.query(
      `SELECT id FROM users WHERE email=$1`,
      [email]
    );

    if (exist.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Email exists",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await pool.query(
      `INSERT INTO users
      (name,email,password,role,distributor_id,created_by,mobile)
      VALUES ($1,$2,$3,'salesman',$4,$5,$6)
      RETURNING id,name,email,role,mobile`,
      [
        name,
        email,
        hash,
        req.user.distributor_id,
        req.user.id,
        mobile || "",
      ]
    );

    res.json({
      success: true,
      data: user.rows[0],
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= LIST SALESMAN =================
exports.list = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,name,email,mobile,is_active,created_at
       FROM users
       WHERE role='salesman'
       AND distributor_id=$1
       ORDER BY id DESC`,
      [req.user.distributor_id]
    );

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

// ================= UPDATE =================
exports.update = async (req, res) => {
  try {
    const { name, mobile } = req.body;

    await pool.query(
      `UPDATE users SET
        name=$1,
        mobile=$2
       WHERE id=$3 AND distributor_id=$4`,
      [name, mobile, req.params.id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Updated",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= ACTIVATE / DEACTIVATE =================
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE users SET is_active = NOT is_active
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Status updated",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= ASSIGN BRANDS =================
exports.assignBrands = async (req, res) => {
  try {
    const { user_id, brand_ids } = req.body;

    if (!brand_ids?.length) {
      return res.status(400).json({
        success: false,
        message: "Brand required",
      });
    }

    // 🧹 DELETE OLD
    await pool.query(
      `DELETE FROM user_brands WHERE user_id=$1`,
      [user_id]
    );

    // ➕ INSERT NEW
    for (const b of brand_ids) {
      await pool.query(
        `INSERT INTO user_brands (user_id,brand_id)
         VALUES ($1,$2)`,
        [user_id, b]
      );
    }

    res.json({
      success: true,
      message: "Brands assigned",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= GET BRANDS =================
exports.getBrands = async (req, res) => {
  try {
    const { id } = req.params;

    const r = await pool.query(
      `SELECT b.id,b.name
       FROM user_brands ub
       JOIN brands b ON b.id=ub.brand_id
       WHERE ub.user_id=$1`,
      [id]
    );

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

// ================= PERFORMANCE =================
exports.performance = async (req, res) => {
  try {
    const { id } = req.params;

    const orders = await pool.query(
      `SELECT COUNT(*) as total_orders,
              COALESCE(SUM(total),0) as revenue
       FROM orders
       WHERE created_by=$1`,
      [id]
    );

    const visits = await pool.query(
      `SELECT COUNT(*) as visits
       FROM worksheets
       WHERE user_id=$1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        orders: Number(orders.rows[0].total_orders),
        revenue: Number(orders.rows[0].revenue),
        visits: Number(visits.rows[0].visits),
      },
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
