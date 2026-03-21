const pool = require('../config/db');


// 🔥 CREATE WORKSHEET (SALESMAN ONLY)
exports.create = async (req, res) => {
  try {
    const {
      retailer_name,
      mobile,
      address,
      interested_for,
      recommended_for,
      comment,
      photo
    } = req.body;

    if (!retailer_name || !mobile) {
      return res.status(400).json({
        message: "Retailer name & mobile required"
      });
    }

    // 🔥 auto salesman
    const salesman_id = req.user.ref_id;

    const result = await pool.query(
      `INSERT INTO worksheet 
      (salesman_id, retailer_name, mobile, address, interested_for, recommended_for, comment, photo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        salesman_id,
        retailer_name,
        mobile,
        address,
        interested_for,
        recommended_for,
        comment,
        photo
      ]
    );

    res.json({
      message: "Worksheet created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating worksheet');
  }
};



// 🔥 LIST ALL (ADMIN + STAFF)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM worksheet ORDER BY id DESC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).send("Error fetching worksheet");
  }
};



// 🔥 SALESMAN OWN DATA
exports.myData = async (req, res) => {
  try {
    const salesman_id = req.user.ref_id;

    const result = await pool.query(
      `SELECT * FROM worksheet 
       WHERE salesman_id=$1 
       ORDER BY id DESC`,
      [salesman_id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).send("Error");
  }
};



// 🔥 CONVERT WORKSHEET → LEAD
exports.convertToLead = async (req, res) => {
  try {
    const { worksheet_id, brand_id } = req.body;

    // 🔹 Get worksheet
    const ws = await pool.query(
      `SELECT * FROM worksheet WHERE id=$1`,
      [worksheet_id]
    );

    if (ws.rows.length === 0) {
      return res.status(400).json({
        message: "Worksheet not found"
      });
    }

    const data = ws.rows[0];

    // 🔹 Check duplicate lead
    const existing = await pool.query(
      `SELECT * FROM leads WHERE mobile=$1`,
      [data.mobile]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Lead already exists"
      });
    }

    // 🔹 Create lead
    const lead = await pool.query(
      `INSERT INTO leads 
      (mobile, brand_id, salesman_id, status)
      VALUES ($1,$2,$3,$4) RETURNING *`,
      [
        data.mobile,
        brand_id,
        data.salesman_id,
        'pending'
      ]
    );

    res.json({
      message: "Converted to lead",
      data: lead.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error converting");
  }
};