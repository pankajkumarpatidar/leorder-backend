const pool = require("../config/db");

exports.create = async (req,res)=>{
  try{
    const {name,brand_id} = req.body;
    if(!name || !brand_id){
      return res.status(400).json({success:false,message:"Required"});
    }
    const r = await pool.query(
      `INSERT INTO products (name,brand_id,distributor_id)
       VALUES ($1,$2,$3) RETURNING *`,
      [name,brand_id,req.user.distributor_id]
    );
    res.json({success:true,data:r.rows[0]});
  }catch(e){
    res.status(500).json({success:false,message:e.message});
  }
};

exports.list = async (req,res)=>{
  const r = await pool.query(
    `SELECT * FROM products WHERE distributor_id=$1 ORDER BY id DESC`,
    [req.user.distributor_id]
  );
  res.json({success:true,data:r.rows});
};
