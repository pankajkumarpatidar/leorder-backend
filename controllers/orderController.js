const pool = require('../config/db');


// ================= CREATE ORDER =================
exports.create = async (req, res) => {
  const client = await pool.connect();

  try {
    const { retailer_id, items } = req.body;

    // ✅ ROLE CHECK
    if (!["admin", "salesman"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    // ✅ VALIDATION
    if (!retailer_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data"
      });
    }

    const distributor_id = req.user.distributor_id;
    const created_by = req.user.id;

    await client.query("BEGIN");

    // 🔥 CREATE ORDER (FIXED total_amount 🔥)
    const orderRes = await client.query(
      `INSERT INTO orders 
      (retailer_id, total_amount, status, distributor_id, created_by)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [retailer_id, 0, "pending", distributor_id, created_by]
    );

    const order = orderRes.rows[0];

    let totalAmount = 0;

    // 🔥 LOOP ITEMS
    for (let item of items) {

      if (!item.product_id) {
        throw new Error("Product required");
      }

      const productRes = await client.query(
        `SELECT * FROM products 
         WHERE id=$1 AND distributor_id=$2`,
        [item.product_id, distributor_id]
      );

      if (productRes.rows.length === 0) {
        throw new Error("Product not found");
      }

      const product = productRes.rows[0];

      const qty = Number(item.qty);
      const unit = item.unit || "pcs";

      if (!qty || qty <= 0) {
        throw new Error("Invalid qty");
      }

      // 🔥 FINAL QTY
      let final_qty = qty;
      if (unit === "box") {
        final_qty = qty * Number(product.pcs_per_box || 0);
      }

      // 🔥 BASE PRICE
      let price = Number(product.dp_per_pcs || 0);
      if (unit === "box") {
        price = price * Number(product.pcs_per_box || 0);
      }

      // 🔥 DISCOUNTS
      const trade = Number(item.trade_discount || 0);
      const special = Number(item.special_discount || 0);
      const cash = Number(item.cash_discount || 0);

      let net_rate = price;
      net_rate -= (net_rate * trade / 100);
      net_rate -= (net_rate * special / 100);
      net_rate -= (net_rate * cash / 100);

      const itemTotal = qty * net_rate;
      totalAmount += itemTotal;

      // 🔥 INSERT ITEM
      await client.query(
        `INSERT INTO order_items
        (order_id, product_id, qty, unit, final_qty, price, total,
         trade_discount, special_discount, cash_discount, net_rate,
         distributor_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          order.id,
          product.id,
          qty,
          unit,
          final_qty,
          price,
          itemTotal,
          trade,
          special,
          cash,
          net_rate,
          distributor_id
        ]
      );
    }

    // 🔥 UPDATE TOTAL (FIXED 🔥)
    await client.query(
      `UPDATE orders SET total_amount=$1 WHERE id=$2`,
      [totalAmount, order.id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Order created",
      order_id: order.id,
      total_amount: totalAmount
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ORDER ERROR ❌", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  } finally {
    client.release();
  }
};



// ================= LIST =================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, r.business_name AS retailer_name
       FROM orders o
       LEFT JOIN retailers r ON o.retailer_id = r.id
       WHERE o.distributor_id=$1
       ORDER BY o.id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("LIST ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= MY ORDERS =================
exports.myOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM orders 
       WHERE created_by=$1 AND distributor_id=$2
       ORDER BY id DESC`,
      [req.user.id, req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("MY ORDER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= GET ONE =================
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(
      `SELECT o.*, r.business_name AS retailer_name
       FROM orders o
       LEFT JOIN retailers r ON o.retailer_id = r.id
       WHERE o.id=$1 AND o.distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const items = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id=$1 AND oi.distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    res.json({
      success: true,
      order: orderRes.rows[0],
      items: items.rows
    });

  } catch (err) {
    console.error("GET ORDER ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const { order_id, status } = req.body;

    // ✅ ROLE CHECK
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update status"
      });
    }

    if (!order_id || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid data"
      });
    }

    const result = await pool.query(
      `UPDATE orders 
       SET status=$1
       WHERE id=$2 AND distributor_id=$3
       RETURNING *`,
      [status, order_id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Status updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("STATUS ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};