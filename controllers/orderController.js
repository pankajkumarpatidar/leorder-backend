const pool = require('../config/db');


// ================= CREATE ORDER =================
exports.create = async (req, res) => {
  const client = await pool.connect();

  try {
    const { retailer_id, items } = req.body;

    if (!retailer_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data"
      });
    }

    const created_by = req.user.id;
    const distributor_id = req.user.distributor_id;

    await client.query("BEGIN");

    // 🔥 Create order (total = 0 initially)
    const orderResult = await client.query(
      `INSERT INTO orders 
      (retailer_id, total_amount, status, distributor_id, created_by) 
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        retailer_id,
        0,
        "pending",
        distributor_id,
        created_by
      ]
    );

    const order = orderResult.rows[0];

    let total = 0;

    // 🔥 Insert items
    for (let item of items) {
      const itemTotal = item.qty * item.price;
      total += itemTotal;

      await client.query(
        `INSERT INTO order_items 
        (order_id, product_name, qty, price, total, distributor_id) 
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          order.id,
          item.product_name || "Product",
          item.qty,
          item.price,
          itemTotal,
          distributor_id
        ]
      );
    }

    // 🔥 Update total
    await client.query(
      `UPDATE orders SET total_amount=$1 WHERE id=$2`,
      [total, order.id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Order created successfully",
      order_id: order.id,
      total
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("CREATE ORDER ERROR ❌", err);

    res.status(500).json({
      success: false,
      message: "Order creation failed"
    });

  } finally {
    client.release();
  }
};



// ================= LIST ALL =================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM orders 
       WHERE distributor_id=$1 
       ORDER BY id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("LIST ERROR ❌", err);
    res.status(500).json({ success: false });
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
    console.error("MY ORDERS ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= GET ONE =================
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await pool.query(
      `SELECT * FROM orders 
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const items = await pool.query(
      `SELECT * FROM order_items 
       WHERE order_id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    res.json({
      success: true,
      order: order.rows[0],
      items: items.rows
    });

  } catch (err) {
    console.error("GET ONE ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const { order_id, status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
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
        message: "Order not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Status updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("STATUS ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};