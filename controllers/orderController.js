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

    // 🔥 VALIDATE RETAILER
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

    // 🔒 SALESMAN → own retailer only
    if (
      req.user.role === "salesman" &&
      rCheck.rows[0].created_by !== req.user.id
    ) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "Not your retailer",
      });
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
      (retailer_id,distributor_id,created_by,total,
       payment_type,credit_days,due_date)
      VALUES ($1,$2,$3,0,$4,$5,$6)
      RETURNING id`,
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

    // ================= ITEMS =================
    for (const i of items) {
      const p = await client.query(
        `SELECT * FROM products
         WHERE id=$1 AND distributor_id=$2`,
        [i.product_id, req.user.distributor_id]
      );

      const product = p.rows[0];
      if (!product) continue;

      // 🔒 BRAND CHECK (SALESMAN)
      if (
        req.user.role === "salesman" &&
        !req.user.brand_ids.includes(product.brand_id)
      ) {
        continue;
      }

      const price = product.dp_small || 0;

      const conversion =
        i.unit === product.unit_big
          ? product.conversion || 1
          : 1;

      const final_qty = i.qty * conversion;

      let base = final_qty * price;

      let afterTrade =
        base - (base * (i.trade_discount || 0)) / 100;

      let afterSpecial =
        afterTrade - (afterTrade * (i.special_discount || 0)) / 100;

      let afterCash =
        afterSpecial - (afterSpecial * (i.cash_discount || 0)) / 100;

      const net_rate =
        final_qty ? afterCash / final_qty : 0;

      total += afterCash;

      await client.query(
        `INSERT INTO order_items
        (order_id,product_id,distributor_id,
         qty,unit,final_qty,price,total,
         trade_discount,special_discount,cash_discount,net_rate)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          order.rows[0].id,
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

    // 🔥 UPDATE TOTAL
    await client.query(
      `UPDATE orders SET total=$1 WHERE id=$2`,
      [total, order.rows[0].id]
    );

    // 🔥 COMMISSION + INCENTIVE
    await commissionController.applyCommission(
      order.rows[0].id,
      req.user.id,
      client
    );

    await incentiveController.updateAchievement(
      req.user.id,
      total,
      client
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Order created",
      total: Math.round(total),
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
    let query = `
      SELECT o.*, r.business_name
      FROM orders o
      JOIN retailers r ON r.id = o.retailer_id
      WHERE o.distributor_id=$1
    `;

    const values = [req.user.distributor_id];
    let i = 2;

    if (req.user.role === "salesman") {
      query += ` AND o.created_by=$${i++}`;
      values.push(req.user.id);
    }

    query += ` ORDER BY o.id DESC`;

    const r = await pool.query(query, values);

    res.json({
      success: true,
      data: r.rows,
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

    await pool.query(
      `UPDATE orders SET
        status='APPROVED',
        approved_by=$1,
        approved_at=NOW()
       WHERE id=$2`,
      [req.user.id, req.params.id]
    );

    res.json({
      success: true,
      message: "Approved",
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
      `SELECT o.*, r.business_name
       FROM orders o
       JOIN retailers r ON r.id=o.retailer_id
       WHERE o.id=$1`,
      [id]
    );

    const items = await pool.query(
      `SELECT oi.*, p.name
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
