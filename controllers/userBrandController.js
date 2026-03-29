const pool = require("../config/db");

// ===== ASSIGN BRANDS =====
exports.assign = async (req, res) => {
  try {
    // 🔥 ADMIN + STAFF ALLOWED
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const { user_id, brand_ids } = req.body;

    if (!user_id || !Array.isArray(brand_ids)) {
      return res.status(400).json({
        success: false,
        message: "User & brands required",
      });
    }

    await pool.query(
      `DELETE FROM user_brands WHERE user_id=$1`,
      [user_id]
    );

    for (let brand_id of brand_ids) {
      await pool.query(
        `INSERT INTO user_brands (user_id, brand_id)
         VALUES ($1,$2)`,
        [user_id, brand_id]
      );
    }

    res.json({
      success: true,
      message: "Brands assigned",
    });

  } catch (err) {
    console.log("ASSIGN ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===== GET USER BRANDS =====
exports.getUserBrands = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT b.id, b.name
       FROM user_brands ub
       JOIN brands b ON ub.brand_id = b.id
       WHERE ub.user_id=$1`,
      [user_id]
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.log("GET USER BRANDS ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===== REMOVE SINGLE BRAND =====
exports.remove = async (req, res) => {
  try {
    // 🔥 ADMIN + STAFF
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const { user_id, brand_id } = req.body;

    await pool.query(
      `DELETE FROM user_brands
       WHERE user_id=$1 AND brand_id=$2`,
      [user_id, brand_id]
    );

    res.json({
      success: true,
      message: "Removed",
    });

  } catch (err) {
    console.log("REMOVE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};