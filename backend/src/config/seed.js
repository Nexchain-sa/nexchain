const pool = require('./db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Categories
    const cats = [
      [1,'تقنية المعلومات','Information Technology','💻'],
      [2,'المعدات الصناعية','Industrial Equipment','🏭'],
      [3,'الصحة والطب','Healthcare & Medical','🏥'],
      [4,'البناء والمقاولات','Construction','🏗️'],
      [5,'الخدمات اللوجستية','Logistics & Transport','🚚'],
      [6,'المواد الغذائية','Food & Beverages','🍱'],
      [7,'المواد الكيميائية','Chemicals','⚗️'],
      [8,'الطاقة والكهرباء','Energy & Electrical','⚡'],
      [9,'المستلزمات المكتبية','Office Supplies','📦'],
      [10,'الخدمات المهنية','Professional Services','🤝'],
    ];
    for (const [id,ar,en,icon] of cats) {
      await client.query(
        `INSERT INTO categories(id,name_ar,name_en,icon) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING`,
        [id,ar,en,icon]
      );
    }

    // Admin user
    const hash = await bcrypt.hash('Admin@123456', 12);
    await client.query(`
      INSERT INTO users(name,email,password,role,company_name,is_verified,is_approved)
      VALUES($1,$2,$3,'admin',$4,true,true)
      ON CONFLICT(email) DO NOTHING
    `, ['مدير النظام', 'admin@FLOWRIZ.sa', hash, 'FLOWRIZ Platform']);

    // Demo buyer
    const buyerHash = await bcrypt.hash('Buyer@123456', 12);
    await client.query(`
      INSERT INTO users(name,email,password,role,company_name,phone,city,is_verified,is_approved)
      VALUES($1,$2,$3,'buyer',$4,$5,$6,true,true)
      ON CONFLICT(email) DO NOTHING
    `, ['شركة الرياض للتقنية','buyer@demo.com',buyerHash,'شركة الرياض للتقنية','+966501234567','الرياض']);

    // Demo supplier
    const supHash = await bcrypt.hash('Supplier@123456', 12);
    await client.query(`
      INSERT INTO users(name,email,password,role,company_name,phone,city,is_verified,is_approved)
      VALUES($1,$2,$3,'supplier',$4,$5,$6,true,true)
      ON CONFLICT(email) DO NOTHING
    `, ['مؤسسة النخبة للتوريد','supplier@demo.com',supHash,'مؤسسة النخبة للتوريد','+966509876543','جدة']);

    await client.query('COMMIT');
    console.log('✅ Seed data inserted!');
    console.log('👤 Admin:    admin@FLOWRIZ.sa    / Admin@123456');
    console.log('🛒 Buyer:    buyer@demo.com       / Buyer@123456');
    console.log('📦 Supplier: supplier@demo.com    / Supplier@123456');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
  } finally {
    client.release();
    pool.end();
  }
};

seed();
