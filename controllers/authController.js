const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ================= HELPER =================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      distributor_id: user.distributor_id,
      brand_ids: user.brand_ids || [],
      category_ids: user.category_ids || [],
      is_category_restricted: user.is_category_restricted || false,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      business_name,
      person_name,
      email,
      password,
      mobile,
      gst_no,
      address,
    } = req.body;

    // 🔥 VALIDATION
    if (!business_name || !person_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // 🔥 EMAIL CHECK
    const existing = await client.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    // ================= CREATE DISTRIBUTOR =================
    const dist = await client.query(
      `INSERT INTO distributors
      (business_name, person_name, email, mobile, gst_no, address)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        business_name,
        person_name,
        email,
        mobile || "",
        gst_no || "",
        address || "",
      ]
    );

    const distributor_id = dist.rows[0].id;

    // ================= CREATE ADMIN =================
    const userRes = await client.query(
      `INSERT INTO users
      (name,email,password,role,distributor_id,mobile)
      VALUES ($1,$2,$3,'admin',$4,$5)
      RETURNING *`,
      [person_name, email, hashed, distributor_id, mobile || ""]
    );

    await client.query("COMMIT");

    const user = userRes.rows[0];

    user.brand_ids = [];
    user.category_ids = [];

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Account created",
      token,
      user,
    });

  } catch (err) {
    await client.query("ROLLBACK");

    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    client.release();
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    delete user.password;

    // ================= BRAND ACCESS =================
    const brandRes = await pool.query(
      `SELECT brand_id FROM user_brands WHERE user_id=$1`,
      [user.id]
    );

    const brand_ids = brandRes.rows.map((b) => b.brand_id);

    // ================= CATEGORY ACCESS =================
    const catRes = await pool.query(
      `SELECT category_id FROM user_brand_categories WHERE user_id=$1`,
      [user.id]
    );

    const category_ids = catRes.rows.map((c) => c.category_id);

    user.brand_ids = brand_ids;
    user.category_ids = category_ids;

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
