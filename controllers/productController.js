const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


// 🔥 CREATE PRODUCT (ADMIN ONLY)
exports.create = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can create product" });
    }

    const { name, brand_id, pcs_per_box, dp_per_pcs, mrp_per_pcs } = req.body;

    const result = await pool.query(
      `INSERT INTO products 
      (name, brand_id, pcs_per_box, dp_per_pcs, mrp_per_pcs)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        name,
        Number(brand_id),
        Number(pcs_per_box || 0),
        Number(dp_per_pcs || 0),
        Number(mrp_per_pcs || 0)
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating product" });
  }
};



// 🔥 UPDATE PRODUCT (ADMIN + STAFF)
exports.update = async (req, res) => {
  try {
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id, dp_per_pcs, mrp_per_pcs } = req.body;

    await pool.query(
      `UPDATE products 
       SET dp_per_pcs=$1, mrp_per_pcs=$2 
       WHERE id=$3`,
      [
        Number(dp_per_pcs),
        Number(mrp_per_pcs),
        Number(id)
      ]
    );

    res.json({ message: "Product updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating product" });
  }
};



// 🔹 LIST PRODUCTS (ALL LOGGED USERS)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM products ORDER BY id DESC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
};



// 🔥 PRICE LIST (JSON)
exports.priceList = async (req, res) => {
  try {
    const brand_id = Number(req.params.brand_id);

    const result = await pool.query(
      `SELECT 
        id,
        name,
        pcs_per_box,
        dp_per_pcs,
        (dp_per_pcs * pcs_per_box) AS dp_per_box,
        mrp_per_pcs,
        (mrp_per_pcs * pcs_per_box) AS mrp_per_box
      FROM products
      WHERE brand_id = $1
      ORDER BY name ASC`,
      [brand_id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ message: "Error fetching price list" });
  }
};



// 🔥 PDF PRICE LIST
exports.priceListPDF = async (req, res) => {
  try {
    const brand_id = Number(req.params.brand_id);

    const result = await pool.query(
      `SELECT name, pcs_per_box, dp_per_pcs 
       FROM products 
       WHERE brand_id=$1 
       ORDER BY name ASC`,
      [brand_id]
    );

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=price-list.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('PRICE LIST', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Product | PCS/Box | PCS Price | Box Price');
    doc.moveDown();

    result.rows.forEach(p => {
      const box = p.dp_per_pcs * p.pcs_per_box;

      doc.text(`${p.name} | ${p.pcs_per_box} | ${p.dp_per_pcs} | ${box}`);
    });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "PDF Error" });
  }
};



// 🔥 EXCEL PRICE LIST
exports.priceListExcel = async (req, res) => {
  try {
    const brand_id = Number(req.params.brand_id);

    const result = await pool.query(
      `SELECT name, pcs_per_box, dp_per_pcs 
       FROM products 
       WHERE brand_id=$1 
       ORDER BY name ASC`,
      [brand_id]
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Price List');

    sheet.columns = [
      { header: 'Product Name', key: 'name', width: 25 },
      { header: 'PCS/Box', key: 'pcs_per_box', width: 15 },
      { header: 'Price (PCS)', key: 'dp_per_pcs', width: 15 },
      { header: 'Price (Box)', key: 'dp_per_box', width: 15 }
    ];

    result.rows.forEach(p => {
      sheet.addRow({
        name: p.name,
        pcs_per_box: p.pcs_per_box,
        dp_per_pcs: p.dp_per_pcs,
        dp_per_box: p.dp_per_pcs * p.pcs_per_box
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
    console.error(err);
    res.status(500).json({ message: "Excel Error" });
  }
};



// 🔥 WHATSAPP SHARE LINK
exports.sharePriceList = async (req, res) => {
  try {
    const brand_id = req.params.brand_id;

    // 👉 production me domain change karna
    const fileLink = `http://localhost:5000/api/product/price-list-excel/${brand_id}`;

    const whatsappLink = `https://wa.me/?text=Download Price List: ${fileLink}`;

    res.json({
      message: "Share link ready",
      whatsapp_link: whatsappLink
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating share link" });
  }
};