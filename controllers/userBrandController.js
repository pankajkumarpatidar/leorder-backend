const pool = require("../config/db");

// ================= ASSIGN BRAND =================
exports.assign = async (req, res) => {
  try {
    const { user_id, brand_id, category_ids = [] } = req.body;

    if (!user_id || !brand_id) {
      return res.status(400).json({
        success: false,
        message: "user_id & brand_id required",
      });
    }

    // 🔒 ONLY ADMIN / STAFF
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    // 🔥 CHECK USER EXISTS
    const userCheck = await pool.query(
      `SELECT id, role FROM users WHERE id=$1 AND distributor_id=$2`,
      [user_id, req.user.distributor_id]
    );

    if (!userCheck.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (userCheck.rows[0].role !== "salesman") {
      return res.status(400).json({
        success: false,
        message: "Only salesman allowed",
      });
    }

    // 🔥 REMOVE OLD (same brand)
    await pool.query(
      `DELETE FROM user_brands 
       WHERE user_id=$1 AND brand_id=$2`,
      [user_id, brand_id]
    );

    // 🔥 INSERT MULTI CATEGORY
    if (category_ids.length) {
      for (const cat of category_ids) {
        await pool.query(
          `INSERT INTO user_brands 
          (user_id, brand_id, category_id)
          VALUES ($1,$2,$3)`,
          [user_id, brand_id, cat]
        );
      }
    } else {
      // FULL BRAND ACCESS
      await pool.query(
        `INSERT INTO user_brands 
        (user_id, brand_id, category_id)
        VALUES ($1,$2,NULL)`,
        [user_id, brand_id]
      );
    }

    res.json({
      success: true,
      message: "Brand assigned",
    });

  } catch (e) {
    console.log("ASSIGN BRAND ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= GET USER BRANDS =================
exports.getUserBrands = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT ub.*, b.name AS brand_name
       FROM user_brands ub
       JOIN brands b ON b.id = ub.brand_id
       WHERE ub.user_id=$1`,
      [user_id]
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (e) {
    console.log("GET USER BRANDS ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= REMOVE BRAND =================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    await pool.query(
      `DELETE FROM user_brands WHERE id=$1`,
      [id]
    );

    res.json({
      success: true,
      message: "Removed",
    });

  } catch (e) {
    console.log("REMOVE BRAND ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= GET MY BRANDS =================
exports.myBrands = async (req, res) => {
  try {
    // 🔥 ADMIN = ALL
    if (req.user.role === "admin") {
      const all = await pool.query(
        `SELECT * FROM brands WHERE distributor_id=$1`,
        [req.user.distributor_id]
      );

      return res.json({
        success: true,
        data: all.rows,
      });
    }

    // 🔥 SALESMAN / STAFF
    const result = await pool.query(
      `SELECT DISTINCT b.*
       FROM user_brands ub
       JOIN brands b ON b.id = ub.brand_id
       WHERE ub.user_id=$1`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (e) {
    console.log("MY BRANDS ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
