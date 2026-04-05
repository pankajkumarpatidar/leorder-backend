const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// ================= VERIFY TOKEN =================
exports.verifyToken = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";

    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token",
      });
    }

    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 FETCH FULL USER FROM DB (IMPORTANT)
    const userRes = await pool.query(
      `SELECT id, role, distributor_id, is_active 
       FROM users WHERE id=$1`,
      [decoded.id]
    );

    if (!userRes.rows.length) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User inactive",
      });
    }

    // 🔥 GET BRAND IDS (FOR SALESMAN)
    let brand_ids = [];
    let category_map = {};

    if (user.role === "salesman") {
      const brands = await pool.query(
        `SELECT brand_id, category_id 
         FROM user_brands 
         WHERE user_id=$1`,
        [user.id]
      );

      brand_ids = [...new Set(brands.rows.map(b => b.brand_id))];

      // category mapping
      brands.rows.forEach(b => {
        if (!category_map[b.brand_id]) {
          category_map[b.brand_id] = [];
        }
        if (b.category_id) {
          category_map[b.brand_id].push(b.category_id);
        }
      });
    }

    // 🔥 FINAL USER OBJECT
    req.user = {
      id: user.id,
      role: user.role,
      distributor_id: user.distributor_id,
      brand_ids,
      category_map,
    };

    next();

  } catch (e) {
    return res.status(401).json({
      success: false,
      message: "Invalid/Expired token",
    });
  }
};


// ================= ROLE CHECK =================
exports.checkRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden - Role not allowed",
    });
  }
  next();
};


// ================= ADMIN ONLY =================
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }
  next();
};


// ================= STAFF OR ADMIN =================
exports.isStaffOrAdmin = (req, res, next) => {
  if (!["admin", "staff"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Staff/Admin only",
    });
  }
  next();
};


// ================= SALESMAN ONLY =================
exports.isSalesman = (req, res, next) => {
  if (req.user.role !== "salesman") {
    return res.status(403).json({
      success: false,
      message: "Salesman only",
    });
  }
  next();
};


// ================= BRAND ACCESS CHECK =================
exports.checkBrandAccess = (req, res, next) => {
  try {
    const { brand_id } = req.body;

    // 🔥 ADMIN = FULL ACCESS
    if (req.user.role === "admin") {
      return next();
    }

    // 🔥 STAFF = FULL ACCESS
    if (req.user.role === "staff") {
      return next();
    }

    // 🔒 SALESMAN
    if (!req.user.brand_ids.includes(brand_id)) {
      return res.status(403).json({
        success: false,
        message: "Brand access denied",
      });
    }

    next();

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= CATEGORY ACCESS CHECK =================
exports.checkCategoryAccess = (req, res, next) => {
  try {
    const { brand_id, category_id } = req.body;

    if (req.user.role !== "salesman") return next();

    const allowedCategories = req.user.category_map[brand_id] || [];

    // 🔥 अगर category restriction है
    if (allowedCategories.length > 0) {
      if (!allowedCategories.includes(category_id)) {
        return res.status(403).json({
          success: false,
          message: "Category access denied",
        });
      }
    }

    next();

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= OWN DATA CHECK =================
exports.checkOwnership = (field = "created_by") => {
  return async (req, res, next) => {
    try {
      const table = req.params.table;
      const id = req.params.id;

      if (!table || !id) return next();

      const r = await pool.query(
        `SELECT ${field} FROM ${table} WHERE id=$1`,
        [id]
      );

      if (!r.rows.length) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      // 🔥 ADMIN / STAFF bypass
      if (["admin", "staff"].includes(req.user.role)) {
        return next();
      }

      if (r.rows[0][field] !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not your data",
        });
      }

      next();

    } catch (e) {
      res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  };
};


// ================= LOG USER REQUEST =================
exports.logUser = (req, res, next) => {
  console.log(
    `👤 ${req.user?.id} (${req.user?.role}) → ${req.method} ${req.originalUrl}`
  );
  next();
};
