const pool = require("../config/db");

// ================= APPLY COMMISSION =================
exports.applyCommission = async (order_id, user_id, client) => {
  try {
    // 🔥 GET USER ROLE
    const user = await client.query(
      `SELECT role FROM users WHERE id=$1`,
      [user_id]
    );

    if (!user.rows.length) return;

    // ❌ ONLY SALESMAN GETS COMMISSION
    if (user.rows[0].role !== "salesman") return;

    // 🔥 GET ORDER ITEMS
    const items = await client.query(
      `SELECT oi.*, p.brand_id
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=$1`,
      [order_id]
    );

    for (const item of items.rows) {
      // 🔥 DEFAULT COMMISSION %
      let percentage = 2; // default 2%

      // 👉 future: brand wise commission
      const custom = await client.query(
        `SELECT percentage 
         FROM brand_commissions
         WHERE brand_id=$1 LIMIT 1`,
        [item.brand_id]
      );

      if (custom.rows.length) {
        percentage = custom.rows[0].percentage;
      }

      const amount = (item.total * percentage) / 100;

      await client.query(
        `INSERT INTO commissions
        (user_id,order_id,product_id,brand_id,amount,percentage)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          user_id,
          order_id,
          item.product_id,
          item.brand_id,
          amount,
          percentage,
        ]
      );
    }

  } catch (e) {
    console.log("COMMISSION ERROR:", e);
    throw e;
  }
};


// ================= MY COMMISSION =================
exports.myCommission = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT *
       FROM commissions
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.id]
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


// ================= TOTAL COMMISSION =================
exports.totalCommission = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT SUM(amount) as total
       FROM commissions
       WHERE user_id=$1`,
      [req.user.id]
    );

    res.json({
      success: true,
      total: r.rows[0].total || 0,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
