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
        
        if (!fs.existsSync(filePath)) return reject('ملف البيانات غير موجود');

        fs.createReadStream(filePath, { encoding: 'utf8' })
            .pipe(csv({ separator: ';' }))
            .on('data', (row) => {
                // 1. استخراج الكود من السطر وتنظيفه
                let rowCode = row.CodePart ? row.CodePart.toString().trim() : "";

                // 2. معالجة مشكلة التنسيق العلمي (E+14) القادمة من الإكسيل
                // هذا الجزء يضمن تحويل 1.91E+14 إلى الرقم الكامل قبل المقارنة
                if (rowCode.includes('E+')) {
                    rowCode = BigInt(Math.round(Number(rowCode))).toString();
                }

                // 3. المقارنة الصارمة (لا يقبل النتيجة إلا إذا تطابق الكود تماماً)
                if (rowCode === targetCode.trim()) {
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
            res.status(404).json({ success: false, message: 'الكود غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل بنجاح على المنفذ ${PORT}`);
});
