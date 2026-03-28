const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== ROUTES IMPORT =====
const authRoutes = require("./routes/authRoutes");
const brandRoutes = require("./routes/brandRoutes");
const leadRoutes = require("./routes/leadRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const retailerRoutes = require("./routes/retailerRoutes");
const salesmanRoutes = require("./routes/salesmanRoutes");
const worksheetRoutes = require("./routes/worksheetRoutes");

// ===== ROUTES USE =====

// 🔐 AUTH (login/register + maybe users)
app.use("/api/auth", authRoutes);

// 🏷️ BRANDS
app.use("/api/brands", brandRoutes);

// 📊 LEADS
app.use("/api/leads", leadRoutes);

// 📦 ORDERS
app.use("/api/orders", orderRoutes);

// 🛒 PRODUCTS
app.use("/api/products", productRoutes);

// 🏪 RETAILERS
app.use("/api/retailers", retailerRoutes);

// 👨‍💼 SALESMAN
app.use("/api/salesman", salesmanRoutes);

// 📋 WORKSHEET
app.use("/api/worksheet", worksheetRoutes);

// ===== TEST ROUTE =====
app.get("/", (req, res) => {
  res.send("🚀 API RUNNING");
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ===== SERVER START =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});