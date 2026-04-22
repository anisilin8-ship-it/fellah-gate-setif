import express from 'express';
import path from 'path';
import mysql from 'mysql2';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;

// باش نخدمو __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// اتصال بقاعدة البيانات
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bouabat_el_fellah'
});

db.connect(err => {
  if (err) {
    console.error('❌ خطأ في الاتصال:', err);
  } else {
    console.log('✅ متصل بقاعدة البيانات');
  }
});

// API المواسم
app.get('/api/saisons', (req, res) => {
  res.json([
    { id: 1, nom: '2024/2025' },
    { id: 2, nom: '2025/2026' }
  ]);
});

// API الفلاح
app.get('/api/fellah/:code', (req, res) => {
  const code = req.params.code;

  const query = `
    SELECT * FROM fellahs WHERE code_part = ?
  `;

  db.query(query, [code], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'خطأ في السيرفر' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'فلاح غير موجود' });
    }

    res.json(results[0]);
  });
});

app.listen(PORT, () => {
  console.log(`🌾 بوابة الفلاح تعمل على: http://localhost:${PORT}`);
});