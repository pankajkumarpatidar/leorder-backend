const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.create = async (req,res)=>{
  try{
    const {name,email,password,mobile} = req.body;
    if(!name||!email||!password){
      return res.status(400).json({success:false,message:"All fields required"});
    }
    const ex = await pool.query("SELECT id FROM users WHERE email=$1",[email]);
    if(ex.rows.length) return res.status(409).json({success:false,message:"Email exists"});

    const hashed = await bcrypt.hash(password,10);

    const r = await pool.query(
      `INSERT INTO users (name,email,password,role,distributor_id,mobile)
       VALUES ($1,$2,$3,'salesman',$4,$5) RETURNING id,name,email,role,mobile`,
      [name,email,hashed,req.user.distributor_id,mobile||""]
    );
    res.json({success:true,data:r.rows[0]});
  }catch(e){
    res.status(500).json({success:false,message:e.message});
  }
};

exports.list = async (req,res)=>{
  const r = await pool.query(
    `SELECT id,name,email,mobile FROM users
     WHERE role='salesman' AND distributor_id=$1 ORDER BY id DESC`,
    [req.user.distributor_id]
  );
  res.json({success:true,data:r.rows});
};
