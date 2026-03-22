const pool = require('../config/db');


// 🔥 CREATE ORDER
exports.create = async (req, res) => {
  try {
    const { retailer_id, items, total } = req.body;

    // 🧠 role based creator
    let created_by = req.user.id;

    // 🔥 INSERT ORDER
    const orderResult = await pool.query(
      `INSERT INTO orders 
      (retailer_id, total, status, distributor_id, created_by) 
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        retailer_id,
        total,
        "pending",
        req.user.distributor_id, // 🔥 MUST
        created_by
      ]
    );

    const order = orderResult.rows[0];

    // 🔥 INSERT ITEMS
    for (let item of items) {
      await pool.query(
        `INSERT INTO order_items 
        (order_id, product_id, qty, price, distributor_id) 
        VALUES ($1,$2,$3,$4,$5)`,
        [
          order.id,
          item.product_id,
          item.qty,
          item.price,
          req.user.distributor_id
        ]
      );
    }

    res.json({
      success: true,
      message: "Order created",
      data: order
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



// 🔥 LIST ALL (ADMIN + STAFF)
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
      data: result.rows
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};



// 🔥 MY ORDERS (SALESMAN)
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
      data: result.rows
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};



// 🔥 GET SINGLE ORDER
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
    res.status(500).json({ success: false });
  }
};



// 🔥 UPDATE STATUS (ADMIN + STAFF)
exports.updateStatus = async (req, res) => {
  try {
    const { order_id, status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
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
        message: "Order not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Status updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};