require('dotenv').config();
const pool = require('./config/db');

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log("DB Connected:", res.rows[0]);
  } catch (err) {
    console.error("DB Error:", err);
  }
}

test();