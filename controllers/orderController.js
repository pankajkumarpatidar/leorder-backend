const pool = require('../config/db');


// 🔥 CREATE ORDER (FINAL UPDATED)
exports.create = async (req, res) => {
  try {
    const { retailer_id, brand_id, salesman_id, items } = req.body;

    // 🔹 Basic validation
    if (!retailer_id || !brand_id || !salesman_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }

    // 🔥 ROLE BASED CHECK

    // Retailer → only own order
    if (req.user.role === 'retailer') {
      if (req.user.ref_id !== retailer_id) {
        return res.status(403).json({
          message: "Retailer can create only their own order"
        });
      }
    }

    // Salesman → (basic check, future enhance)
    if (req.user.role === 'salesman') {
      if (!salesman_id) {
        return res.status(400).json({
          message: "Salesman ID required"
        });
      }
    }

    // 🔹 Create order
    const orderRes = await pool.query(
      `INSERT INTO orders 
      (retailer_id, brand_id, salesman_id, total_amount, status)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [retailer_id, brand_id, salesman_id, 0, 'pending']
    );

    const orderId = orderRes.rows[0].id;
    let totalAmount = 0;

    // 🔹 Loop items
    for (let item of items) {

      const qty = Number(item.qty);
      const productId = Number(item.product_id);

      if (!qty || !productId) {
        return res.status(400).json({ message: "Invalid qty or product_id" });
      }

      if (!['pcs', 'box'].includes(item.unit)) {
        return res.status(400).json({ message: "Invalid unit" });
      }

      // 🔹 Fetch product
      const productRes = await pool.query(
        `SELECT * FROM products WHERE id=$1`,
        [productId]
      );

      if (productRes.rows.length === 0) {
        return res.status(400).json({ message: "Product not found" });
      }

      const product = productRes.rows[0];

      // 🔹 FINAL QTY
      let finalQty = qty;
      if (item.unit === 'box') {
        finalQty = qty * Number(product.pcs_per_box);
      }

      // 🔹 BASE PRICE
      let basePrice =
        item.unit === 'box'
          ? Number(product.dp_per_pcs) * Number(product.pcs_per_box)
          : Number(product.dp_per_pcs);

      // 🔹 DISCOUNTS
      const trade = Number(item.trade_discount || 0);
      const special = Number(item.special_discount || 0);
      const cash = Number(item.cash_discount || 0);

      let netRate = basePrice;

      netRate -= (netRate * trade / 100);
      netRate -= (netRate * special / 100);
      netRate -= (netRate * cash / 100);

      // 🔹 TOTAL
      const total = qty * netRate;
      totalAmount += total;

      // 🔹 INSERT ITEM
      await pool.query(
        `INSERT INTO order_items 
        (order_id, product_name, qty, unit, final_qty, price, total,
         trade_discount, special_discount, cash_discount, net_rate)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          orderId,
          product.name,
          qty,
          item.unit,
          finalQty,
          basePrice,
          total,
          trade,
          special,
          cash,
          netRate
        ]
      );
    }

    // 🔹 Update total
    await pool.query(
      `UPDATE orders SET total_amount=$1 WHERE id=$2`,
      [totalAmount, orderId]
    );

    res.json({
      message: "Order created successfully",
      order_id: orderId,
      total_amount: totalAmount
    });

  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
};



// 🔹 LIST ORDERS (Admin + Staff)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM orders ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error");
  }
};



// 🔹 GET SINGLE ORDER
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 JOIN ADD (IMPORTANT)
    const orderRes = await pool.query(
      `SELECT o.*, r.firm_name AS retailer_name
       FROM orders o
       LEFT JOIN retailers r ON o.retailer_id = r.id
       WHERE o.id=$1`,
      [id]
    );

    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const items = await pool.query(
      `SELECT * FROM order_items WHERE order_id=$1`,
      [id]
    );

    res.json({
      order,
      items: items.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
};



// 🔹 UPDATE STATUS (Admin + Staff only)
exports.updateStatus = async (req, res) => {
  try {
    const { order_id, status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await pool.query(
      `UPDATE orders SET status=$1 WHERE id=$2`,
      [status, order_id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).send("Error");
  }
};