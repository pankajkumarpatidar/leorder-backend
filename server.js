require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/brands", require("./routes/brandRoutes"));
app.use("/api/salesman", require("./routes/salesmanRoutes"));
app.use("/api/leads", require("./routes/leadRoutes"));
app.use("/api/retailers", require("./routes/retailerRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/worksheets", require("./routes/worksheetRoutes"));

// ROOT
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Server error",
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});