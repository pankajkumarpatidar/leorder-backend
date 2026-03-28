const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req,res)=>{
  const client = await pool.connect();
  try{
    const { business_name, person_name, email, password, mobile, gst_no, address } = req.body;
    if(!business_name || !person_name || !email || !password){
      return res.status(400).json({success:false,message:"All required fields missing"});
    }
    const ex = await pool.query("SELECT id FROM users WHERE email=$1",[email]);
    if(ex.rows.length) return res.status(409).json({success:false,message:"Email exists"});

    const hashed = await bcrypt.hash(password,10);

    await client.query("BEGIN");
    const dist = await client.query(
      `INSERT INTO distributors (business_name, person_name, email, mobile, gst_no, address)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [business_name, person_name, email, mobile||"", gst_no||"", address||""]
    );

    const distributor_id = dist.rows[0].id;

    const userRes = await client.query(
      `INSERT INTO users (name,email,password,role,distributor_id)
       VALUES ($1,$2,$3,'admin',$4)
       RETURNING id,name,email,role,distributor_id`,
      [person_name, email, hashed, distributor_id]
    );

    await client.query("COMMIT");

    const user = userRes.rows[0];
    const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn:"7d"});

    res.json({success:true, token, user});
  }catch(err){
    await client.query("ROLLBACK");
    res.status(500).json({success:false,message:err.message});
  }finally{
    client.release();
  }
};

exports.login = async (req,res)=>{
  try{
    const {email,password} = req.body;
    if(!email || !password){
      return res.status(400).json({success:false,message:"Email & password required"});
    }
    const result = await pool.query("SELECT * FROM users WHERE email=$1",[email]);
    if(!result.rows.length){
      return res.status(404).json({success:false,message:"User not found"});
    }
    const user = result.rows[0];
    const ok = await bcrypt.compare(password,user.password);
    if(!ok) return res.status(401).json({success:false,message:"Wrong password"});

    delete user.password;
    const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn:"7d"});
    res.json({success:true, token, user});
  }catch(err){
    res.status(500).json({success:false,message:err.message});
  }
};
