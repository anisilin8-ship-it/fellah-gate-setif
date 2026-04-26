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
app.use(express.static(__dirname)); 

const findDeliveries = (targetCode) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const filePath = path.join(__dirname, 'deliveries.csv');

        if (!fs.existsSync(filePath)) {
            return reject('ملف deliveries.csv غير موجود بجانب السيرفر');
        }

        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' })) 
            .on('data', (row) => {
                if (row.CodePart && row.CodePart.trim() === targetCode.trim()) {
                    results.push(row);
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

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
            // التعديل 1: إزالة status(404) لضمان وصول الرد للمتصفح بوضوح
            res.json({ success: false, message: 'الكود غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- التعديلات الجوهرية للإنترنت (Render) ---

// التعديل 2: استخدام المنفذ الذي يفرضه Render تلقائياً
const PORT = process.env.PORT || 3001; 

// التعديل 3: إضافة '0.0.0.0' لفتح السيرفر للاستقبال من الإنترنت
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ النظام جاهز وعالمي الآن!`);
    console.log(`➜ المنفذ المستخدم: ${PORT}`);
});
