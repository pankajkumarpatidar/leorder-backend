const pool = require('../config/db');


// 🔥 CREATE LEAD (ONLY SALESMAN)
exports.create = async (req, res) => {
  try {
    const { mobile, brand_id } = req.body;

    if (!mobile || !brand_id) {
      return res.status(400).json({ message: "Mobile and brand required" });
    }

    // 🔥 auto assign salesman
    const salesman_id = req.user.ref_id;

    const result = await pool.query(
      `INSERT INTO leads (mobile, brand_id, salesman_id, status)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [mobile, brand_id, salesman_id, 'pending']
    );

    res.json({
      message: "Lead created successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating lead");
  }
};



// 🔹 LIST LEADS (ADMIN + STAFF)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leads ORDER BY id DESC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).send("Error fetching leads");
  }
};



// 🔹 SALESMAN → OWN LEADS
exports.myLeads = async (req, res) => {
  try {
    const salesman_id = req.user.ref_id;

    const result = await pool.query(
      `SELECT * FROM leads WHERE salesman_id=$1 ORDER BY id DESC`,
      [salesman_id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).send("Error");
  }
};



// 🔥 UPDATE STATUS (APPROVE / REJECT)
exports.updateStatus = async (req, res) => {
  try {
    const { lead_id, status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await pool.query(
      `UPDATE leads SET status=$1 WHERE id=$2`,
      [status, lead_id]
    );

    res.json({ message: `Lead ${status}` });

  } catch (err) {
    res.status(500).send("Error updating status");
  }
};



// 🔥 CONVERT LEAD → RETAILER
exports.convertToRetailer = async (req, res) => {
  try {
    const {
      lead_id,
      firm_name,
      owner_name,
      email,
      address,
      gst_no,
      account_type,
      credit_limit,
      credit_days
    } = req.body;

    // 🔹 Get lead
    const leadRes = await pool.query(
      `SELECT * FROM leads WHERE id=$1`,
      [lead_id]
    );

    if (leadRes.rows.length === 0) {
      return res.status(400).json({ message: "Lead not found" });
    }

    const lead = leadRes.rows[0];

    if (lead.status !== 'approved') {
      return res.status(400).json({ message: "Lead not approved" });
    }

    // 🔹 Check existing retailer
    const existing = await pool.query(
      `SELECT * FROM retailers WHERE mobile=$1`,
      [lead.mobile]
    );

    let retailerId;

    if (existing.rows.length > 0) {
      retailerId = existing.rows[0].id;
    } else {
      const newRetailer = await pool.query(
        `INSERT INTO retailers 
        (firm_name, owner_name, mobile, email, address, gst_no, account_type, credit_limit, credit_days)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          firm_name,
          owner_name,
          lead.mobile,
          email,
          address,
          gst_no,
          account_type,
          credit_limit,
          credit_days
        ]
      );

      retailerId = newRetailer.rows[0].id;
    }

    // 🔹 Map brand
    await pool.query(
      `INSERT INTO retailer_brands (retailer_id, brand_id, salesman_id)
       VALUES ($1,$2,$3)`,
      [retailerId, lead.brand_id, lead.salesman_id]
    );

    // 🔹 Update lead
    await pool.query(
      `UPDATE leads SET status='converted' WHERE id=$1`,
      [lead_id]
    );

    res.json({
      message: "Lead converted successfully",
      retailer_id: retailerId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error converting lead");
  }
};