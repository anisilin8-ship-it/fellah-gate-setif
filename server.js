import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // لتشغيل ملف index.html والصور تلقائياً

// دالة البحث في ملف CSV
const findDeliveries = (targetCode) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const filePath = path.join(__dirname, 'deliveries.csv');

        if (!fs.existsSync(filePath)) {
            return reject('ملف deliveries.csv غير موجود بجانب السيرفر');
        }

        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' })) // استخدام الفاصلة المنقوطة كما في ملفك
            .on('data', (row) => {
                if (row.CodePart && row.CodePart.trim() === targetCode.trim()) {
                    results.push(row);
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

// رابط البحث API
app.get('/api/search/:code', async (req, res) => {
    try {
        const results = await findDeliveries(req.params.code);
        if (results.length > 0) {
            res.json({
                success: true,
                farmerName: results[0].Nom,
                data: results
            });
        } else {
            res.status(404).json({ success: false, message: 'الكود غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✅ النظام جاهز!`);
    console.log(`➜ المحرك (Backend): http://localhost:${PORT}`);
    console.log(`➜ رابط الموقع: http://localhost:${PORT}/index.html`);
});