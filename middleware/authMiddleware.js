const jwt = require("jsonwebtoken");


// ================= VERIFY TOKEN =================
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    // ❌ Wrong format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format (Bearer required)",
      });
    }

    const token = authHeader.split(" ")[1];

    // ❌ No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    // 🔓 VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ❌ Required fields check
    if (!decoded.id || !decoded.role) {
      return res.status(403).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // 🔥 attach user
    req.user = {
      id: decoded.id,
      role: decoded.role,
      distributor_id: decoded.distributor_id || null,
    };

    next();

  } catch (err) {
    console.error("AUTH ERROR ❌", err.message);

    // 🔥 Specific error handling
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired, please login again",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};



// ================= ROLE CHECK =================
exports.checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // ❌ No user
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const userRole = req.user.role;

      // ❌ No role
      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: "User role missing",
        });
      }

      // ❌ Not allowed
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied (${userRole})`,
        });
      }

      next();

    } catch (err) {
      console.error("ROLE ERROR ❌", err.message);

      return res.status(500).json({
        success: false,
        message: "Role check failed",
      });
    }
  };
};



// ================= OPTIONAL ADMIN CHECK =================
exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }
  next();
};