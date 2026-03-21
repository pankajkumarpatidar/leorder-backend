const jwt = require('jsonwebtoken');


// 🔐 VERIFY TOKEN (FINAL)
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token required",
      });
    }

    // ❌ Wrong format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const token = authHeader.split(" ")[1];

    // ❌ Empty token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    // 🔓 VERIFY
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 IMPORTANT: ensure role exists
    if (!decoded.role) {
      return res.status(403).json({
        success: false,
        message: "Role not found in token",
      });
    }

    req.user = decoded;

    next();

  } catch (err) {
    console.error("AUTH ERROR:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};


// 🔐 ROLE CHECK (FINAL SAFE VERSION)
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

      // ❌ Role missing
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: "User role not found",
        });
      }

      // ❌ Not allowed
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied for role: ${req.user.role}`,
        });
      }

      next();

    } catch (err) {
      console.error("ROLE ERROR:", err.message);

      return res.status(500).json({
        success: false,
        message: "Role check failed",
      });
    }
  };
};