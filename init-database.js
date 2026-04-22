import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('🔗 جاري الاتصال بالـ MySQL...');

  // 1. إنشاء قاعدة البيانات
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await connection.query(`USE \`${process.env.DB_NAME}\``);

  // 2. إنشاء جدول الفلاحين (مطابق لملف CSV الخاص بك)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS fellahs (
      code_part VARCHAR(50) PRIMARY KEY,
      nom_part VARCHAR(100),
      prenom_part VARCHAR(100),
      fils_de VARCHAR(100),
      lib_com VARCHAR(100)
    )
  `);

  // 3. إنشاء جدول البونات (مطابق لملف CSV الخاص بك)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS bons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code_part VARCHAR(50),
      n_bon VARCHAR(50),
      produit VARCHAR(100),
      quantite DECIMAL(10, 2),
      date_bon VARCHAR(50),
      etat VARCHAR(50) DEFAULT 'قيد الانتظار',
      FOREIGN KEY (code_part) REFERENCES fellahs(code_part)
    )
  `);

  console.log('✅ تم حفر الأساسات بنجاح (الجداول جاهزة)!');
  await connection.end();
}

init().catch(err => console.log('❌ خطأ:', err));