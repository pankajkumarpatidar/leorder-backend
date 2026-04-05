const pool = require("../config/db");

// ================= CREATE BRAND =================
exports.create = async (req, res) => {
  try {
    if (!["admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can create brand",
      });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name required",
      });
    }

    const exist = await pool.query(
      `SELECT id FROM brands WHERE name=$1 AND distributor_id=$2`,
      [name, req.user.distributor_id]
    );

    if (exist.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Brand exists",
      });
    }

    const r = await pool.query(
      `INSERT INTO brands (name, distributor_id)
       VALUES ($1,$2)
       RETURNING *`,
      [name, req.user.distributor_id]
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

// ================= LIST BRANDS =================
exports.list = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM brands
       WHERE distributor_id=$1
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

// ================= DELETE BRAND =================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 CHECK CATEGORY
    const cat = await pool.query(
      `SELECT id FROM categories WHERE brand_id=$1`,
      [id]
    );

    if (cat.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Delete categories first",
      });
    }

    await pool.query(
      `DELETE FROM brands
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Brand deleted",
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
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name required",
      });
    }

    await pool.query(
      `UPDATE brands 
       SET name=$1 
       WHERE id=$2 AND distributor_id=$3`,
      [name, req.params.id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Brand updated",
    });

  } catch (e) {
    console.log("UPDATE BRAND ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
