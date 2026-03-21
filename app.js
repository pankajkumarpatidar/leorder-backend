const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();


// 🔥 MIDDLEWARES
app.use(cors());
app.use(express.json());


// 🔥 HEALTH CHECK
app.get('/', (req, res) => {
  res.send('Leorder API Running 🚀');
});


// 🔥 ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/worksheet', require('./routes/worksheetRoutes'));
app.use('/api/lead', require('./routes/leadRoutes'));
app.use('/api/retailer', require('./routes/retailerRoutes'));
app.use('/api/brand', require('./routes/brandRoutes'));
app.use('/api/salesman', require('./routes/salesmanRoutes'));
app.use('/api/order', require('./routes/orderRoutes'));
app.use('/api/product', require('./routes/productRoutes'));


// 🔥 404 HANDLER (IMPORTANT)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});


// 🔥 GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});


module.exports = app;