const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ success:false, message:"Unauthorized" });
    }
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      distributor_id: decoded.distributor_id
    };
    next();
  } catch (e) {
    return res.status(401).json({ success:false, message:"Invalid/Expired token" });
  }
};

exports.checkRole = (...roles) => (req,res,next)=>{
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success:false, message:"Forbidden" });
  }
  next();
};
