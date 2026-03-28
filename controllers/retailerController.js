const pool = require("../config/db");

exports.create = async (req,res)=>{
  try{
    const {business_name,mobile} = req.body;
    if(!business_name || !mobile){
      return res.status(400).json({success:false,message:"Required"});
    }
    const ex = await pool.query(
      `SELECT id FROM retailers WHERE mobile=$1 AND distributor_id=$2`,
      [mobile,req.user.distributor_id]
    );
    if(ex.rows.length) return res.status(409).json({success:false,message:"Exists"});

    const r = await pool.query(
      `INSERT INTO retailers (business_name,mobile,distributor_id)
       VALUES ($1,$2,$3) RETURNING *`,
      [business_name,mobile,req.user.distributor_id]
    );
    res.json({success:true,data:r.rows[0]});
  }catch(e){
    res.status(500).json({success:false,message:e.message});
  }
};

exports.list = async (req,res)=>{
  const r = await pool.query(
    `SELECT * FROM retailers WHERE distributor_id=$1 ORDER BY id DESC`,
    [req.user.distributor_id]
  );
  res.json({success:true,data:r.rows});
};
