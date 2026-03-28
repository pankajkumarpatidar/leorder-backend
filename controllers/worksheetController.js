const pool = require("../config/db");

exports.create = async (req,res)=>{
  const {mobile,notes} = req.body;
  const r = await pool.query(
    `INSERT INTO worksheets (user_id,distributor_id,mobile,notes)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id,req.user.distributor_id,mobile,notes]
  );
  res.json({success:true,data:r.rows[0]});
};

exports.list = async (req,res)=>{
  const r = await pool.query(
    `SELECT * FROM worksheets WHERE distributor_id=$1 ORDER BY id DESC`,
    [req.user.distributor_id]
  );
  res.json({success:true,data:r.rows});
};
