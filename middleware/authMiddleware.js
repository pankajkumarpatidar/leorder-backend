const jwt = require("jsonwebtoken");


// ================= VERIFY TOKEN =================
exports.verifyToken = (req, res, next) => {
  try {
    let authHeader = req.headers.authorization || req.headers.Authorization;

    // ✅ Header missing
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    // ✅ Support: Bearer / token only
    let token;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = authHeader; // fallback (mobile apps etc.)
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    // 🔓 VERIFY
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ STRICT CHECK
    if (!decoded.id || !decoded.role || !decoded.distributor_id) {
      return res.status(403).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // 🔥 attach user
    req.user = {
      id: decoded.id,
      role: decoded.role,
      distributor_id: decoded.distributor_id,
    };

    next();

  } catch (err) {
    console.error("AUTH ERROR ❌", err.name, err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired, login again",
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
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: "User role missing",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied for role: ${req.user.role}`,
        });
      }

      next();

    } catch (err) {
      console.error("ROLE ERROR ❌", err.message);

      res.status(500).json({
        success: false,
        message: "Role check failed",
      });
    }
  };
};



// ================= ADMIN ONLY =================
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }
  next();
};



// ================= OPTIONAL: OWNER CHECK =================
// (use when resource must belong to user)
exports.isOwner = (getUserIdFn) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getUserIdFn(req);

      if (!ownerId || ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied (not owner)",
        });
      }

      next();

    } catch (err) {
      console.error("OWNER CHECK ERROR ❌", err.message);
      res.status(500).json({
        success: false,
        message: "Owner check failed",
      });
    }
  };
};