const pool = require('../config/db');


// 🔥 CREATE SALESMAN (ADMIN ONLY)
exports.create = async (req, res) => {
  try {
    const { name, mobile, email, address } = req.body;

    if (!name || !mobile || !email) {
      return res.status(400).json({
        message: "Name, mobile, email required"
      });
    }

    // 🔹 Check duplicate email
    const existing = await pool.query(
      `SELECT * FROM salesman WHERE email=$1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Salesman already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO salesman (name, mobile, email, address)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, mobile, email, address]
    );

    res.json({
      message: "Salesman created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating salesman");
  }
};



// 🔥 LIST SALESMAN (ADMIN + STAFF)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM salesman ORDER BY id DESC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).send("Error fetching salesman");
  }
};



// 🔥 GET SINGLE SALESMAN
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM salesman WHERE id=$1`,
      [id]
    );

    const data = result.rows[0];

    if (!data) {
      return res.status(404).json({
        message: "Salesman not found"
      });
    }

    res.json(data);

  } catch (err) {
    res.status(500).send("Error");
  }
};



// 🔥 UPDATE SALESMAN
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, mobile, address } = req.body;

    await pool.query(
      `UPDATE salesman SET
        name=$1,
        mobile=$2,
        address=$3
       WHERE id=$4`,
      [name, mobile, address, id]
    );

    res.json({ message: "Salesman updated" });

  } catch (err) {
    res.status(500).send("Error updating salesman");
  }
};



// 🔥 DELETE SALESMAN
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM salesman WHERE id=$1`,
      [id]
    );

    res.json({ message: "Salesman deleted" });

  } catch (err) {
    res.status(500).send("Error deleting salesman");
  }
};