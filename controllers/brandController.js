const pool = require('../config/db');


// ================= CREATE BRAND =================
exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name required"
      });
    }

    // 🔹 duplicate check (same distributor)
    const existing = await pool.query(
      `SELECT * FROM brands 
       WHERE LOWER(name)=LOWER($1) AND distributor_id=$2`,
      [name, req.user.distributor_id]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: false,
        message: "Brand already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO brands (name, distributor_id)
       VALUES ($1,$2) RETURNING *`,
      [name, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Brand created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("CREATE BRAND ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= LIST =================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM brands 
       WHERE distributor_id=$1
       ORDER BY id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("LIST BRAND ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= GET ONE =================
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM brands 
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error("GET BRAND ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= UPDATE =================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await pool.query(
      `UPDATE brands 
       SET name=$1
       WHERE id=$2 AND distributor_id=$3
       RETURNING *`,
      [name, id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }

    res.json({
      success: true,
      message: "Brand updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("UPDATE BRAND ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= DELETE =================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM brands 
       WHERE id=$1 AND distributor_id=$2
       RETURNING *`,
      [id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }

    res.json({
      success: true,
      message: "Brand deleted"
    });

  } catch (err) {
    console.error("DELETE BRAND ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};