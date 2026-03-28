require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/brands", require("./routes/brandRoutes"));
app.use("/api/salesman", require("./routes/salesmanRoutes"));
app.use("/api/leads", require("./routes/leadRoutes"));
app.use("/api/retailers", require("./routes/retailerRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/worksheets", require("./routes/worksheetRoutes"));

app.get("/",(req,res)=>res.send("API Running"));

app.listen(process.env.PORT || 5000, ()=>console.log("Server running"));
