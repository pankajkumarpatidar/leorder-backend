const pool = require("../config/db");

exports.create = async (req,res)=>{
  try{
    const {name} = req.body;
    if(!name) return res.status(400).json({success:false,message:"Name required"});

    const ex = await pool.query(
      `SELECT id FROM brands WHERE LOWER(name)=LOWER($1) AND distributor_id=$2`,
      [name,req.user.distributor_id]
    );
    if(ex.rows.length) return res.status(409).json({success:false,message:"Brand exists"});

    const r = await pool.query(
      `INSERT INTO brands (name,distributor_id) VALUES ($1,$2) RETURNING *`,
      [name,req.user.distributor_id]
    );
    res.json({success:true,data:r.rows[0]});
  }catch(e){
    res.status(500).json({success:false,message:e.message});
  }
};

exports.list = async (req,res)=>{
  const r = await pool.query(
    `SELECT * FROM brands WHERE distributor_id=$1 ORDER BY id DESC`,
    [req.user.distributor_id]
  );
  res.json({success:true,data:r.rows});
};
