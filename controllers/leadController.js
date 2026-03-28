const pool = require("../config/db");

exports.create = async (req,res)=>{
  try{
    const {mobile,brand_id} = req.body;
    if(!mobile || !brand_id){
      return res.status(400).json({success:false,message:"Mobile & brand required"});
    }
    const ex = await pool.query(
      `SELECT id FROM leads WHERE mobile=$1 AND distributor_id=$2`,
      [mobile,req.user.distributor_id]
    );
    if(ex.rows.length) return res.status(409).json({success:false,message:"Lead exists"});

    const r = await pool.query(
      `INSERT INTO leads (mobile,brand_id,salesman_id,distributor_id,status)
       VALUES ($1,$2,$3,$4,'new') RETURNING *`,
      [mobile,brand_id,req.user.id,req.user.distributor_id]
    );
    res.json({success:true,data:r.rows[0]});
  }catch(e){
    res.status(500).json({success:false,message:e.message});
  }
};

exports.list = async (req,res)=>{
  const r = await pool.query(
    `SELECT l.*, b.name AS brand_name
     FROM leads l LEFT JOIN brands b ON l.brand_id=b.id
     WHERE l.distributor_id=$1 ORDER BY l.id DESC`,
    [req.user.distributor_id]
  );
  res.json({success:true,data:r.rows});
};

exports.updateStatus = async (req,res)=>{
  const {lead_id,status} = req.body;
  const r = await pool.query(
    `UPDATE leads SET status=$1 WHERE id=$2 AND distributor_id=$3 RETURNING *`,
    [status,lead_id,req.user.distributor_id]
  );
  res.json({success:true,data:r.rows[0]});
};
