const pool = require("../config/db");

// ================= DASHBOARD SUMMARY =================
exports.summary = async (req, res) => {
  try {
    const distributor_id = req.user.distributor_id;

    // 🔥 TOTAL SALES
    const sales = await pool.query(
      `SELECT COALESCE(SUM(total),0) as total_sales
       FROM orders
       WHERE distributor_id=$1`,
      [distributor_id]
    );

    // 🔥 TOTAL ORDERS
    const orders = await pool.query(
      `SELECT COUNT(*) as total_orders
       FROM orders
       WHERE distributor_id=$1`,
      [distributor_id]
    );

    // 🔥 TOTAL RETAILERS
    const retailers = await pool.query(
      `SELECT COUNT(*) as total_retailers
       FROM retailers
       WHERE distributor_id=$1`,
      [distributor_id]
    );

    // 🔥 TODAY SALES
    const today = await pool.query(
      `SELECT COALESCE(SUM(total),0) as today_sales
       FROM orders
       WHERE distributor_id=$1
       AND DATE(created_at)=CURRENT_DATE`,
      [distributor_id]
    );

    res.json({
      success: true,
      data: {
        total_sales: Number(sales.rows[0].total_sales),
        total_orders: Number(orders.rows[0].total_orders),
        total_retailers: Number(retailers.rows[0].total_retailers),
        today_sales: Number(today.rows[0].today_sales),
      },
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= BRAND WISE SALES =================
exports.brandSales = async (req, res) => {
  try {
    const distributor_id = req.user.distributor_id;

    const r = await pool.query(
      `SELECT 
        b.name AS brand,
        COALESCE(SUM(oi.total),0) as revenue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN brands b ON b.id = p.brand_id
       WHERE oi.distributor_id=$1
       GROUP BY b.name
       ORDER BY revenue DESC`,
      [distributor_id]
    );

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= CATEGORY SALES =================
exports.categorySales = async (req, res) => {
  try {
    const distributor_id = req.user.distributor_id;

    const r = await pool.query(
      `SELECT 
        c.name AS category,
        COALESCE(SUM(oi.total),0) as revenue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE oi.distributor_id=$1
       GROUP BY c.name
       ORDER BY revenue DESC`,
      [distributor_id]
    );

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= SALESMAN PERFORMANCE =================
exports.salesmanPerformance = async (req, res) => {
  try {
    const distributor_id = req.user.distributor_id;

    const r = await pool.query(
      `SELECT 
        u.name AS salesman,
        COUNT(o.id) as orders,
        COALESCE(SUM(o.total),0) as revenue
       FROM users u
       LEFT JOIN orders o ON o.created_by = u.id
       WHERE u.role='salesman'
       AND u.distributor_id=$1
       GROUP BY u.name
       ORDER BY revenue DESC`,
      [distributor_id]
    );

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ================= MONTHLY SALES =================
exports.monthlySales = async (req, res) => {
  try {
    const distributor_id = req.user.distributor_id;

    const r = await pool.query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(total) as revenue
       FROM orders
       WHERE distributor_id=$1
       GROUP BY month
       ORDER BY month`,
      [distributor_id]
    );

    res.json({
      success: true,
      data: r.rows,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
