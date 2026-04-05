const pool = require("../config/db");
const bcrypt = require("bcrypt");

// ================= CREATE SALESMAN =================
exports.createSalesman = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
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

    const r = await pool.query(
      `INSERT INTO users
      (name,email,password,role,distributor_id,created_by,mobile)
      VALUES ($1,$2,$3,'salesman',$4,$5,$6)
      RETURNING id,name,email,role`,
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
      data: r.rows[0],
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= LEAD APPROVAL =================
exports.approveLead = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only staff/admin",
      });
    }

    const { id } = req.params;

    const lead = await pool.query(
      `SELECT * FROM leads WHERE id=$1`,
      [id]
    );

    if (!lead.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const l = lead.rows[0];

    // 🔥 UPDATE LEAD
    await pool.query(
      `UPDATE leads SET
        status='approved',
        approved_by=$1,
        approved_at=NOW()
       WHERE id=$2`,
      [req.user.id, id]
    );

    // 🔥 AUTO CREATE RETAILER
    await pool.query(
      `INSERT INTO retailers
      (business_name,email,mobile,gst_status,gst_no,address,pincode,
       distributor_id,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        l.business_name,
        l.email,
        l.mobile,
        l.gst_status,
        l.gst_no,
        l.address,
        l.pincode,
        l.distributor_id,
        l.created_by,
      ]
    );

    res.json({
      success: true,
      message: "Lead approved & retailer created",
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

    await pool.query(`DELETE FROM user_brands WHERE user_id=$1`, [
      user_id,
    ]);

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

// ================= ORDER APPROVAL =================
exports.approveOrder = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { id } = req.params;

    await pool.query(
      `UPDATE orders SET
        status='APPROVED'
       WHERE id=$1`,
      [id]
    );

    res.json({
      success: true,
      message: "Order approved",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= DASHBOARD =================
exports.dashboard = async (req, res) => {
  try {
    const dist = req.user.distributor_id;

    const orders = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE distributor_id=$1`,
      [dist]
    );

    const sales = await pool.query(
      `SELECT COALESCE(SUM(total),0) FROM orders WHERE distributor_id=$1`,
      [dist]
    );

    const leads = await pool.query(
      `SELECT COUNT(*) FROM leads WHERE distributor_id=$1`,
      [dist]
    );

    const retailers = await pool.query(
      `SELECT COUNT(*) FROM retailers WHERE distributor_id=$1`,
      [dist]
    );

    res.json({
      success: true,
      data: {
        orders: Number(orders.rows[0].count),
        sales: Number(sales.rows[0].coalesce),
        leads: Number(leads.rows[0].count),
        retailers: Number(retailers.rows[0].count),
      },
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= SALESMAN LIST =================
exports.salesmanList = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,name,email,mobile
       FROM users
       WHERE role='salesman'
       AND distributor_id=$1`,
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
