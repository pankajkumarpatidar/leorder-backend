const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


// ================= CREATE PRODUCT =================
exports.create = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admin allowed"
      });
    }

    const {
      name,
      brand_id,
      category_id,
      unit,
      pcs_per_box,
      dp_per_pcs,
      mrp_per_pcs
    } = req.body;

    if (!name || !brand_id) {
      return res.json({
        success: false,
        message: "Name & brand required"
      });
    }

    const result = await pool.query(
      `INSERT INTO products 
      (name, brand_id, category_id, unit, pcs_per_box, dp_per_pcs, mrp_per_pcs, distributor_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        name,
        brand_id,
        category_id || null,
        unit || "pcs",
        Number(pcs_per_box || 0),
        Number(dp_per_pcs || 0),
        Number(mrp_per_pcs || 0),
        req.user.distributor_id
      ]
    );

    res.json({
      success: true,
      message: "Product created",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= UPDATE PRODUCT =================
exports.update = async (req, res) => {
  try {
    const { id } = req.body;

    const {
      dp_per_pcs,
      mrp_per_pcs,
      unit
    } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET dp_per_pcs=$1, mrp_per_pcs=$2, unit=$3
       WHERE id=$4 AND distributor_id=$5
       RETURNING *`,
      [
        Number(dp_per_pcs),
        Number(mrp_per_pcs),
        unit,
        id,
        req.user.distributor_id
      ]
    );

    res.json({
      success: true,
      message: "Product updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("UPDATE PRODUCT ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= LIST PRODUCTS =================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.*,
        b.name AS brand_name,
        c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.distributor_id=$1
      ORDER BY p.id DESC`,
      [req.user.distributor_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("LIST PRODUCT ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= PRICE LIST =================
exports.priceList = async (req, res) => {
  try {
    const { brand_id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.unit,
        c.name AS category,
        p.pcs_per_box,
        p.dp_per_pcs,
        (p.dp_per_pcs * p.pcs_per_box) AS dp_per_box,
        p.mrp_per_pcs,
        (p.mrp_per_pcs * p.pcs_per_box) AS mrp_per_box
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.brand_id=$1 AND p.distributor_id=$2
      ORDER BY p.name ASC`,
      [brand_id, req.user.distributor_id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("PRICE LIST ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};



// ================= EXCEL =================
exports.priceListExcel = async (req, res) => {
  try {
    const { brand_id } = req.params;

    const result = await pool.query(
      `SELECT name, unit, pcs_per_box, dp_per_pcs 
       FROM products 
       WHERE brand_id=$1 AND distributor_id=$2`,
      [brand_id, req.user.distributor_id]
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Price List');

    sheet.columns = [
      { header: 'Product', key: 'name', width: 25 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'PCS/Box', key: 'pcs_per_box', width: 10 },
      { header: 'DP', key: 'dp_per_pcs', width: 10 },
      { header: 'Box Price', key: 'box', width: 15 }
    ];

    result.rows.forEach(p => {
      sheet.addRow({
        name: p.name,
        unit: p.unit,
        pcs_per_box: p.pcs_per_box,
        dp_per_pcs: p.dp_per_pcs,
        box: p.dp_per_pcs * p.pcs_per_box
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=price-list.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("EXCEL ERROR ❌", err);
    res.status(500).json({ success: false });
  }
};