const pool = require("../config/db");

// ================= CREATE ORDER =================
exports.create = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      retailer_id,
      items,
      payment_type = "CASH",
      credit_days = 0,
    } = req.body;

    await client.query("BEGIN");

    // 🔥 LEAD CHECK
    if (retailer_id) {
      const leadCheck = await client.query(
        `SELECT id FROM leads
         WHERE retailer_id=$1
         AND distributor_id=$2
         AND status='approved'
         LIMIT 1`,
        [retailer_id, req.user.distributor_id]
      );

      if (!leadCheck.rows.length) {
        await client.query("ROLLBACK");
        return res.status(403).json({
          success: false,
          message: "Retailer lead not approved",
        });
      }
    }

    // 📅 DUE DATE
    let due_date = null;
    if (payment_type === "CREDIT") {
      const d = new Date();
      d.setDate(d.getDate() + Number(credit_days));
      due_date = d;
    }

    // 🧾 CREATE ORDER
    const order = await client.query(
      `INSERT INTO orders 
       (retailer_id,total,status,distributor_id,created_by,payment_type,credit_days,due_date)
       VALUES ($1,0,'pending',$2,$3,$4,$5,$6) RETURNING id`,
      [
        retailer_id,
        req.user.distributor_id,
        req.user.id,
        payment_type,
        credit_days,
        due_date,
      ]
    );

    let total = 0;

    for (const i of items) {
      const p = await client.query(
        `SELECT dp_per_pcs, pcs_per_box FROM products 
         WHERE id=$1 AND distributor_id=$2`,
        [i.product_id, req.user.distributor_id]
      );

      if (!p.rows.length) continue;

      const product = p.rows[0];

      const price = Number(product.dp_per_pcs || 0);
      const conversion = Number(product.pcs_per_box || 1);

      const final_qty = Number(i.qty) * conversion;

      // 💰 CALCULATION
      let base = final_qty * price;

      let afterTrade =
        base - (base * Number(i.trade_discount || 0)) / 100;

      let afterSpecial =
        afterTrade -
        (afterTrade * Number(i.special_discount || 0)) / 100;

      let afterCash =
        afterSpecial -
        (afterSpecial * Number(i.cash_discount || 0)) / 100;

      const net_rate =
        final_qty > 0 ? afterCash / final_qty : 0;

      total += afterCash;

      await client.query(
        `INSERT INTO order_items 
        (order_id,product_id,qty,unit,final_qty,price,total,
         trade_discount,special_discount,cash_discount,net_rate,distributor_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          order.rows[0].id,
          i.product_id,
          i.qty,
          i.unit || "PCS",
          final_qty,
          price,
          afterCash,
          i.trade_discount || 0,
          i.special_discount || 0,
          i.cash_discount || 0,
          net_rate,
          req.user.distributor_id,
        ]
      );
    }

    // 🔥 ROUND TOTAL
    total = Math.round(total);

    await client.query(
      `UPDATE orders SET total=$1 WHERE id=$2`,
      [total, order.rows[0].id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      total,
      message: "Order created successfully",
    });

  } catch (e) {
    await client.query("ROLLBACK");
    console.log("ORDER CREATE ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  } finally {
    client.release();
  }
};


// ================= LIST ORDERS =================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.*,
        COALESCE(r.business_name, 'Walk-in') AS retailer_name
      FROM orders o
      LEFT JOIN retailers r ON r.id = o.retailer_id
      WHERE o.distributor_id = $1
      ORDER BY o.id DESC`,
      [req.user.distributor_id]
    );

    const today = new Date();

    const data = result.rows.map((o) => ({
      ...o,
      is_overdue:
        o.payment_type === "CREDIT" &&
        o.due_date &&
        new Date(o.due_date) < today,
    }));

    res.json({
      success: true,
      data,
    });

  } catch (e) {
    console.log("ORDER LIST ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ================= ORDER DETAILS =================
exports.details = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await pool.query(
      `SELECT 
        o.*,
        COALESCE(r.business_name, 'Walk-in') AS retailer_name
       FROM orders o
       LEFT JOIN retailers r ON r.id = o.retailer_id
       WHERE o.id=$1 AND o.distributor_id=$2`,
      [orderId, req.user.distributor_id]
    );

    if (!order.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const items = await pool.query(
      `SELECT 
         oi.*,
         p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=$1`,
      [orderId]
    );

    res.json({
      success: true,
      data: {
        order: order.rows[0],
        items: items.rows,
      },
    });

  } catch (e) {
    console.log("ORDER DETAILS ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};