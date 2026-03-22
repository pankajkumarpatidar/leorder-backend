const pool = require('../config/db');


// 🔥 CREATE RETAILER
exports.create = async (req, res) => {
  try {
    const { name, mobile, address } = req.body;

    const result = await pool.query(
      `INSERT INTO retailers 
      (name, mobile, address, distributor_id)
      VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, mobile, address, req.user.distributor_id]
    );

    res.json({
      success: true,
      message: "Retailer created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error creating retailer" });
  }
};



// 🔥 LIST RETAILERS (FILTERED)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM retailers 
       WHERE distributor_id = $1 
       ORDER BY id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching retailers" });
  }
};



// 🔥 GET SINGLE RETAILER
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM retailers 
       WHERE id=$1 AND distributor_id=$2`,
      [id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching retailer" });
  }
};



// 🔥 UPDATE RETAILER
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, address } = req.body;

    const result = await pool.query(
      `UPDATE retailers 
       SET name=$1, mobile=$2, address=$3 
       WHERE id=$4 AND distributor_id=$5 
       RETURNING *`,
      [name, mobile, address, id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Retailer updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating retailer" });
  }
};



// 🔥 DELETE RETAILER
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM retailers 
       WHERE id=$1 AND distributor_id=$2 
       RETURNING *`,
      [id, req.user.distributor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Retailer deleted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error deleting retailer" });
  }
};