const pool = require("../config/db");

// ===== CREATE =====
exports.create = async (req, res) => {
  try {
    const {
      name,
      brand_id,
      category_id,
      unit,
      pcs_per_box,
      dp_per_pcs,
      mrp_per_pcs,
    } = req.body;

    if (!name || !brand_id) {
      return res.status(400).json({
        success: false,
        message: "Name & Brand required",
      });
    }

    const r = await pool.query(
      `INSERT INTO products
      (name,brand_id,category_id,unit,pcs_per_box,dp_per_pcs,mrp_per_pcs,distributor_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        name,
        brand_id,
        category_id || null,
        unit || null,
        pcs_per_box || null,
        dp_per_pcs || null,
        mrp_per_pcs || null,
        req.user.distributor_id,
      ]
    );

    res.json({ success: true, data: r.rows[0] });

  } catch (e) {
    console.log("CREATE PRODUCT ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ===== LIST =====
exports.list = async (req, res) => {
  try {
    let result;

    if (req.user.role === "salesman") {
      // 🔥 only his brands
      result = await pool.query(
        `SELECT p.* FROM products p
         JOIN brands b ON p.brand_id = b.id
         WHERE b.distributor_id=$1
         ORDER BY p.id DESC`,
        [req.user.distributor_id]
      );
    } else {
      // ✅ admin / staff
      result = await pool.query(
        `SELECT * FROM products
         WHERE distributor_id=$1
         ORDER BY id DESC`,
        [req.user.distributor_id]
      );
    }

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (e) {
    console.log("LIST PRODUCT ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ===== UPDATE =====
exports.update = async (req, res) => {
  try {
    const {
      name,
      brand_id,
      category_id,
      unit,
      pcs_per_box,
      dp_per_pcs,
      mrp_per_pcs,
    } = req.body;

    await pool.query(
      `UPDATE products SET
        name=$1,
        brand_id=$2,
        category_id=$3,
        unit=$4,
        pcs_per_box=$5,
        dp_per_pcs=$6,
        mrp_per_pcs=$7
       WHERE id=$8 AND distributor_id=$9`,
      [
        name,
        brand_id,
        category_id || null,
        unit || null,
        pcs_per_box || null,
        dp_per_pcs || null,
        mrp_per_pcs || null,
        req.params.id,
        req.user.distributor_id,
      ]
    );

    res.json({
      success: true,
      message: "Updated",
    });

  } catch (e) {
    console.log("UPDATE PRODUCT ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ===== DELETE =====
exports.remove = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM products
       WHERE id=$1 AND distributor_id=$2`,
      [req.params.id, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (e) {
    console.log("DELETE PRODUCT ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};