const pool = require("../config/db");

// ================= CREATE PRODUCT =================
exports.create = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    const {
      name,
      brand_id,
      category_id,
      unit_small,
      mrp_small,
      dp_small,
      unit_big,
      conversion,
    } = req.body;

    // 🔥 VALIDATION
    if (!name || !brand_id || !category_id) {
      return res.status(400).json({
        success: false,
        message: "Name, Brand & Category required",
      });
    }

    if (!unit_small || !dp_small) {
      return res.status(400).json({
        success: false,
        message: "Unit & price required",
      });
    }

    const exist = await pool.query(
      `SELECT id FROM products 
       WHERE name=$1 AND brand_id=$2 AND distributor_id=$3`,
      [name, brand_id, req.user.distributor_id]
    );

    if (exist.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Product exists",
      });
    }

    const r = await pool.query(
      `INSERT INTO products
      (name,brand_id,category_id,distributor_id,
       unit_small,mrp_small,dp_small,
       unit_big,conversion,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        name,
        brand_id,
        category_id,
        req.user.distributor_id,
        unit_small,
        mrp_small || 0,
        dp_small,
        unit_big || null,
        conversion || 1,
        req.user.id,
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

// ================= LIST PRODUCTS =================
exports.list = async (req, res) => {
  try {
    const { search, brand_id, category_id } = req.query;

    let query = `
      SELECT p.*, b.name AS brand_name, c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.distributor_id = $1
    `;

    const values = [req.user.distributor_id];
    let i = 2;

    // 🔒 SALESMAN FILTER
    if (req.user.role === "salesman") {

      // brand filter
      if (req.user.brand_ids?.length) {
        query += ` AND p.brand_id = ANY($${i++})`;
        values.push(req.user.brand_ids);
      }

      // category restriction
      if (req.user.is_category_restricted && req.user.category_ids?.length) {
        query += ` AND p.category_id = ANY($${i++})`;
        values.push(req.user.category_ids);
      }
    }

    // 🔍 SEARCH
    if (search) {
      query += ` AND LOWER(p.name) LIKE LOWER($${i++})`;
      values.push(`%${search}%`);
    }

    // 🔍 FILTERS
    if (brand_id) {
      query += ` AND p.brand_id = $${i++}`;
      values.push(brand_id);
    }

    if (category_id) {
      query += ` AND p.category_id = $${i++}`;
      values.push(category_id);
    }

    query += ` ORDER BY p.id DESC`;

    const r = await pool.query(query, values);

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    console.log("PRODUCT LIST ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= UPDATE PRODUCT =================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      brand_id,
      category_id,
      unit_small,
      mrp_small,
      dp_small,
      unit_big,
      conversion,
    } = req.body;

    await pool.query(
      `UPDATE products SET
        name=$1,
        brand_id=$2,
        category_id=$3,
        unit_small=$4,
        mrp_small=$5,
        dp_small=$6,
        unit_big=$7,
        conversion=$8
       WHERE id=$9 AND distributor_id=$10`,
      [
        name,
        brand_id,
        category_id,
        unit_small,
        mrp_small,
        dp_small,
        unit_big,
        conversion,
        id,
        req.user.distributor_id,
      ]
    );

    res.json({
      success: true,
      message: "Product updated",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= DELETE PRODUCT =================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM products
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Product deleted",
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
