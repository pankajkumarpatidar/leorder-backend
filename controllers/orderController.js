// ===== FILE: orderController.js =====

const pool = require("../config/db");
const commissionController = require("./commissionController");
const incentiveController = require("./incentiveController");

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

    if (!items?.length) {
      return res.status(400).json({
        success: false,
        message: "Items required",
      });
    }

    await client.query("BEGIN");

    // ================= RETAILER CHECK =================
    const rCheck = await client.query(
      `SELECT * FROM retailers
       WHERE id=$1 AND distributor_id=$2`,
      [retailer_id, req.user.distributor_id]
    );

    if (!rCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Retailer not found",
      });
    }

    const retailer = rCheck.rows[0];

    // 🔒 SALESMAN OWN RETAILER
    if (
      req.user.role === "salesman" &&
      retailer.created_by !== req.user.id
    ) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "Not your retailer",
      });
    }

    // ================= DUE DATE =================
    let due_date = null;

    if (payment_type === "CREDIT") {
      const d = new Date();
      d.setDate(d.getDate() + Number(credit_days || 0));
      due_date = d;
    }

    // ================= CREATE ORDER =================
    const orderRes = await client.query(
      `INSERT INTO orders
      (retailer_id,distributor_id,created_by,total,
       payment_type,credit_days,due_date)
      VALUES ($1,$2,$3,0,$4,$5,$6)
      RETURNING *`,
      [
        retailer_id,
        req.user.distributor_id,
        req.user.id,
        payment_type,
        credit_days,
        due_date,
      ]
    );

    const orderId = orderRes.rows[0].id;

    let total = 0;
    let validItemCount = 0;

    // ================= ITEMS LOOP =================
    for (const i of items) {
      if (!i.product_id || !i.qty) continue;

      const p = await client.query(
        `SELECT * FROM products
         WHERE id=$1 AND distributor_id=$2`,
        [i.product_id, req.user.distributor_id]
      );

      const product = p.rows[0];
      if (!product) continue;

      // 🔒 SALESMAN BRAND CHECK
      if (
        req.user.role === "salesman" &&
        req.user.brand_ids?.length &&
        !req.user.brand_ids.includes(product.brand_id)
      ) {
        continue;
      }

      // 🔒 CATEGORY CHECK
      if (
        req.user.role === "salesman" &&
        req.user.is_category_restricted &&
        req.user.category_ids?.length &&
        !req.user.category_ids.includes(product.category_id)
      ) {
        continue;
      }

      const price = Number(product.dp_small || 0);

      const isBigUnit = i.unit === product.unit_big;

      const conversion = isBigUnit
        ? Number(product.conversion || 1)
        : 1;

      const final_qty = Number(i.qty) * conversion;

      if (!final_qty) continue;

      let base = final_qty * price;

      let afterTrade =
        base - (base * Number(i.trade_discount || 0)) / 100;

      let afterSpecial =
        afterTrade - (afterTrade * Number(i.special_discount || 0)) / 100;

      let afterCash =
        afterSpecial - (afterSpecial * Number(i.cash_discount || 0)) / 100;

      const net_rate = afterCash / final_qty;

      total += afterCash;
      validItemCount++;

      await client.query(
        `INSERT INTO order_items
        (order_id,product_id,distributor_id,
         qty,unit,final_qty,price,total,
         trade_discount,special_discount,cash_discount,net_rate)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          orderId,
          i.product_id,
          req.user.distributor_id,
          i.qty,
          i.unit,
          final_qty,
          price,
          afterCash,
          i.trade_discount || 0,
          i.special_discount || 0,
          i.cash_discount || 0,
          net_rate,
        ]
      );
    }

    // ❌ NO VALID ITEMS
    if (validItemCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "No valid items",
      });
    }

    // ================= UPDATE TOTAL =================
    total = Math.round(total);

    await client.query(
      `UPDATE orders SET total=$1 WHERE id=$2`,
      [total, orderId]
    );

    // ================= COMMISSION =================
    await commissionController.applyCommission(
      orderId,
      req.user.id,
      client
    );

    // ================= INCENTIVE =================
    await incentiveController.updateAchievement(
      req.user.id,
      total,
      client
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Order created",
      total,
    });

  } catch (e) {
    await client.query("ROLLBACK");
    console.log("CREATE ORDER ERROR:", e);

    res.status(500).json({
      success: false,
      message: e.message,
    });
  } finally {
    client.release();
  }
};



// ================= LIST =================
exports.list = async (req, res) => {
  try {
    const { payment_type, status, from_date, to_date } = req.query;

    let query = `
      SELECT 
        o.*,
        r.business_name
      FROM orders o
      JOIN retailers r ON r.id = o.retailer_id
      WHERE o.distributor_id=$1
    `;

    const values = [req.user.distributor_id];
    let i = 2;

    // 🔒 SALESMAN FILTER
    if (req.user.role === "salesman") {
      query += ` AND o.created_by=$${i++}`;
      values.push(req.user.id);
    }

    // FILTERS
    if (payment_type) {
      query += ` AND o.payment_type=$${i++}`;
      values.push(payment_type);
    }

    if (status) {
      query += ` AND o.status=$${i++}`;
      values.push(status);
    }

    if (from_date && to_date) {
      query += ` AND o.created_at BETWEEN $${i++} AND $${i++}`;
      values.push(from_date, to_date);
    }

    query += ` ORDER BY o.id DESC`;

    const r = await pool.query(query, values);

    // 🔥 OVERDUE
    const today = new Date();

    const data = r.rows.map((o) => {
      let is_overdue = false;

      if (o.payment_type === "CREDIT" && o.due_date) {
        is_overdue = new Date(o.due_date) < today;
      }

      return {
        ...o,
        is_overdue,
      };
    });

    res.json({
      success: true,
      data,
    });

  } catch (e) {
    console.log("LIST ORDER ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};



// ================= APPROVE =================
exports.approve = async (req, res) => {
  try {
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    const { id } = req.params;

    await pool.query(
      `UPDATE orders SET
        status='APPROVED',
        approved_by=$1,
        approved_at=NOW()
       WHERE id=$2`,
      [req.user.id, id]
    );

    res.json({
      success: true,
      message: "Order approved",
    });

  } catch (e) {
    console.log("APPROVE ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};



// ================= DETAILS =================
exports.details = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await pool.query(
      `SELECT 
        o.*,
        r.business_name,
        r.mobile
       FROM orders o
       JOIN retailers r ON r.id=o.retailer_id
       WHERE o.id=$1`,
      [id]
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
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=$1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        order: order.rows[0],
        items: items.rows,
      },
    });

  } catch (e) {
    console.log("DETAIL ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
