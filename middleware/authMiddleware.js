const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";

    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 FULL USER DATA ATTACH
    req.user = {
      id: decoded.id,
      role: decoded.role,
      distributor_id: decoded.distributor_id,

      // ✅ NEW (VERY IMPORTANT)
      brand_ids: decoded.brand_ids || [], 
    };

    next();

  } catch (e) {
    return res.status(401).json({
      success: false,
      message: "Invalid/Expired token",
    });
  }
};


// ===== ROLE CHECK =====
exports.checkRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }
  next();
};