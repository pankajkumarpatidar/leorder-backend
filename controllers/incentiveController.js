const pool = require("../config/db");

// ================= UPDATE ACHIEVEMENT =================
exports.updateAchievement = async (user_id, order_amount, client) => {
  try {
    // ❌ only salesman
    const u = await client.query(
      `SELECT role FROM users WHERE id=$1`,
      [user_id]
    );

    if (!u.rows.length || u.rows[0].role !== "salesman") return;

    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    // 🔥 FIND EXIST
    let record = await client.query(
      `SELECT * FROM user_incentives
       WHERE user_id=$1 AND month=$2`,
      [user_id, month]
    );

    if (!record.rows.length) {
      // create new
      await client.query(
        `INSERT INTO user_incentives
        (user_id, month, total_sales)
        VALUES ($1,$2,$3)`,
        [user_id, month, order_amount]
      );
    } else {
      const newTotal =
        Number(record.rows[0].total_sales) + Number(order_amount);

      await client.query(
        `UPDATE user_incentives
         SET total_sales=$1
         WHERE user_id=$2 AND month=$3`,
        [newTotal, user_id, month]
      );
    }

    // 🔥 CHECK SLABS
    const updated = await client.query(
      `SELECT * FROM user_incentives
       WHERE user_id=$1 AND month=$2`,
      [user_id, month]
    );

    const total = updated.rows[0].total_sales;

    const slab = await client.query(
      `SELECT * FROM incentive_slabs
       WHERE min_amount <= $1
       ORDER BY min_amount DESC LIMIT 1`,
      [total]
    );

    if (slab.rows.length) {
      await client.query(
        `UPDATE user_incentives
         SET achieved=true,
             reward_amount=$1
         WHERE user_id=$2 AND month=$3`,
        [
          slab.rows[0].reward_amount,
          user_id,
          month,
        ]
      );
    }

  } catch (e) {
    console.log("INCENTIVE ERROR:", e);
    throw e;
  }
};


// ================= MY INCENTIVE =================
exports.myIncentive = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT *
       FROM user_incentives
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


// ================= CURRENT MONTH =================
exports.current = async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7);

    const r = await pool.query(
      `SELECT *
       FROM user_incentives
       WHERE user_id=$1 AND month=$2`,
      [req.user.id, month]
    );

    res.json({
      success: true,
      data: r.rows[0] || null,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
