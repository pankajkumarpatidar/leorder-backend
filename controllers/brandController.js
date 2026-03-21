const pool = require('../config/db');


// 🔥 CREATE BRAND (ADMIN)
exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Brand name required"
      });
    }

    // duplicate check
    const existing = await pool.query(
      `SELECT * FROM brands WHERE LOWER(name)=LOWER($1)`,
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Brand already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO brands (name) VALUES ($1) RETURNING *`,
      [name]
    );

    res.json({
      message: "Brand created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
};



// 🔥 LIST (ALL LOGIN USERS)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM brands ORDER BY id DESC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).send("Error");
  }
};



// 🔥 GET ONE
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM brands WHERE id=$1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: "Brand not found"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).send("Error");
  }
};



// 🔥 UPDATE (ADMIN)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    await pool.query(
      `UPDATE brands SET name=$1 WHERE id=$2`,
      [name, id]
    );

    res.json({ message: "Brand updated" });

  } catch (err) {
    res.status(500).send("Error");
  }
};



// 🔥 DELETE (ADMIN)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM brands WHERE id=$1`,
      [id]
    );

    res.json({ message: "Brand deleted" });

  } catch (err) {
    res.status(500).send("Error");
  }
};