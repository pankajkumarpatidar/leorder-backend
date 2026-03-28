const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.create = async (req,res)=>{
  try{
    const {name,email,password,role} = req.body;
    if(!name || !email || !password || !role){
      return res.status(400).json({success:false,message:"All fields required"});
    }
    if(!["staff","salesman"].includes(role)){
      return res.status(400).json({success:false,message:"Invalid role"});
    }
    const ex = await pool.query("SELECT id FROM users WHERE email=$1",[email]);
    if(ex.rows.length) return res.status(409).json({success:false,message:"Email exists"});

    const hashed = await bcrypt.hash(password,10);

    await pool.query(
      `INSERT INTO users (name,email,password,role,distributor_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [name,email,hashed,role,req.user.distributor_id]
    );

    res.json({success:true,message:"User created"});
  }catch(err){
    res.status(500).json({success:false,message:err.message});
  }
};

exports.list = async (req,res)=>{
  const result = await pool.query(
    `SELECT id,name,email,role,mobile FROM users
     WHERE distributor_id=$1 ORDER BY id DESC`,
    [req.user.distributor_id]
  );
  res.json({success:true,data:result.rows});
};
