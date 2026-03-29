const pool = require("../config/db");

exports.create = async (req,res)=>{
  const client = await pool.connect();
  try{
    const {retailer_id,items} = req.body;

    await client.query("BEGIN");

    // 🔥 NEW: CHECK LEAD APPROVED
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

    const order = await client.query(
      `INSERT INTO orders (retailer_id,total,status,distributor_id,created_by)
       VALUES ($1,0,'pending',$2,$3) RETURNING id`,
      [retailer_id,req.user.distributor_id,req.user.id]
    );

    let total = 0;

    for(const i of items){
      const p = await client.query(
        `SELECT dp_per_pcs FROM products WHERE id=$1 AND distributor_id=$2`,
        [i.product_id,req.user.distributor_id]
      );

      const price = p.rows[0].dp_per_pcs;
      const t = price * i.qty;
      total += t;

      await client.query(
        `INSERT INTO order_items (order_id,product_id,qty,price,total,distributor_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.rows[0].id,i.product_id,i.qty,price,t,req.user.distributor_id]
      );
    }

    await client.query(
      `UPDATE orders SET total=$1 WHERE id=$2`,
      [total,order.rows[0].id]
    );

    await client.query("COMMIT");

    res.json({success:true,total});

  }catch(e){
    await client.query("ROLLBACK");
    res.status(500).json({success:false,message:e.message});
  }finally{
    client.release();
  }
};