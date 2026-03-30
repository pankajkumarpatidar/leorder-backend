const pool = require("../config/db");

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

    // 🔥 CHECK LEAD APPROVED
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

    // 📅 DUE DATE CALC
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

      const product = p.rows[0];

      const price = product.dp_per_pcs || 0;
      const conversion = product.pcs_per_box || 1;

      const final_qty = i.qty * conversion;

      // 💰 CALCULATION
      let base = final_qty * price;

      let afterTrade =
        base - (base * (i.trade_discount || 0)) / 100;

      let afterSpecial =
        afterTrade - (afterTrade * (i.special_discount || 0)) / 100;

      let afterCash =
        afterSpecial - (afterSpecial * (i.cash_discount || 0)) / 100;

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

    // 🔥 UPDATE TOTAL
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
    res.status(500).json({
      success: false,
      message: e.message,
    });
  } finally {
    client.release();
  }
};