// ================= IMPORTS =================
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// ================= INIT =================
const app = express();

// ================= MIDDLEWARE =================

// ✅ CORS
app.use(cors({
  origin: "*", // production me domain lagana
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// ✅ BODY PARSER
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= LOGGER (DEBUG) =================
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.url}`);
  next();
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("🚀 API Running Successfully");
});

// ================= ROUTES =================

// 🔐 AUTH
app.use("/api/auth", require("./routes/authRoutes"));

// 👤 USERS
app.use("/api/users", require("./routes/userRoutes"));

// 🏢 BRANDS + CATEGORY
app.use("/api/brands", require("./routes/brandRoutes"));

// 👨‍💼 SALESMAN
app.use("/api/salesman", require("./routes/salesmanRoutes"));

// 🧾 LEADS
app.use("/api/leads", require("./routes/leadRoutes"));

// 🏪 RETAILERS
app.use("/api/retailers", require("./routes/retailerRoutes"));

// 📦 PRODUCTS
app.use("/api/products", require("./routes/productRoutes"));

// 🧾 ORDERS
app.use("/api/orders", require("./routes/orderRoutes"));

// 📝 WORKSHEET
app.use("/api/worksheets", require("./routes/worksheetRoutes"));

// 🔥 USER BRAND ASSIGN
app.use("/api/user-brands", require("./routes/userBrandRoutes"));

// 💰 COMMISSION
app.use("/api/commission", require("./routes/commissionRoutes"));

// 🎯 INCENTIVE
app.use("/api/incentives", require("./routes/incentiveRoutes"));

// 📊 REPORTS (OPTIONAL)
app.use("/api/reports", require("./routes/reportRoutes"));


// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found ❌",
    path: req.originalUrl,
  });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("💥 ERROR:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================= SERVER START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
