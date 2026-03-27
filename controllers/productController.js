const pool = require('../config/db');
const ExcelJS = require('exceljs');


// ================= CREATE PRODUCT =================
exports.create = async (req, res) => {
  try {
    // ✅ ROLE CHECK
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

    // ✅ VALIDATION
    if (!name || !brand_id) {
      return res.status(400).json({
        success: false,
        message: "Name & brand required"
      });
    }

    const cleanName = name.trim();

    // 🔹 DUPLICATE CHECK (🔥 IMPORTANT)
    const existing = await pool.query(
      `SELECT id FROM products 
       WHERE LOWER(name)=LOWER($1) 
       AND brand_id=$2 AND distributor_id=$3`,
      [cleanName, brand_id, req.user.distributor_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Product already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO products 
      (name, brand_id, category_id, unit, pcs_per_box, dp_per_pcs, mrp_per_pcs, distributor_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        cleanName,
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
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= UPDATE PRODUCT =================
exports.update = async (req, res) => {
  try {
    const { id, dp_per_pcs, mrp_per_pcs, unit } = req.body;

    // ✅ ROLE CHECK
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admin allowed"
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product id required"
      });
    }

    const result = await pool.query(
      `UPDATE products 
       SET dp_per_pcs=$1, mrp_per_pcs=$2, unit=$3
       WHERE id=$4 AND distributor_id=$5
       RETURNING *`,
      [
        Number(dp_per_pcs || 0),
        Number(mrp_per_pcs || 0),
        unit || "pcs",
        id,
        req.user.distributor_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product updated",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("UPDATE PRODUCT ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
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
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ================= PRICE LIST =================
exports.priceList = async (req, res) => {
  try {
    const { brand_id } = req.params;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        message: "Brand id required"
      });
    }

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
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("PRICE LIST ERROR ❌", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
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
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};