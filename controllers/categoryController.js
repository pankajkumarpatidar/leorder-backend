const pool = require("../config/db");

// ================= CREATE CATEGORY =================
exports.create = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    const { name, brand_id } = req.body;

    if (!name || !brand_id) {
      return res.status(400).json({
        success: false,
        message: "Name & Brand required",
      });
    }

    const exist = await pool.query(
      `SELECT id FROM categories
       WHERE name=$1 AND brand_id=$2`,
      [name, brand_id]
    );

    if (exist.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Category exists",
      });
    }

    const r = await pool.query(
      `INSERT INTO categories
      (name,brand_id,distributor_id)
      VALUES ($1,$2,$3)
      RETURNING *`,
      [name, brand_id, req.user.distributor_id]
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

// ================= LIST CATEGORY =================
exports.list = async (req, res) => {
  try {
    const { brand_id } = req.query;

    let query = `
      SELECT * FROM categories
      WHERE distributor_id=$1
    `;

    const values = [req.user.distributor_id];

    if (brand_id) {
      query += ` AND brand_id=$2`;
      values.push(brand_id);
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

// ================= DELETE CATEGORY =================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 CHECK PRODUCT
    const p = await pool.query(
      `SELECT id FROM products WHERE category_id=$1`,
      [id]
    );

    if (p.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Delete products first",
      });
    }

    await pool.query(
      `DELETE FROM categories
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Category deleted",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
