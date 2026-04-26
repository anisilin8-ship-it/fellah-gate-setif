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

        // استخدام الفاصلة العادية وتجاهل علامات الاقتباس تلقائياً
        fs.createReadStream(filePath, { encoding: 'utf8' })
            .pipe(csv({ separator: ',' })) 
            .on('data', (row) => {
                // تنظيف كود الشريك من أي فراغات أو رموز زائدة
                let rowCode = row.CodePart ? row.CodePart.toString().trim() : "";

                // معالجة التنسيق العلمي (E+14) في حال وجوده
                if (rowCode.includes('E+')) {
                    rowCode = BigInt(Math.round(Number(rowCode))).toString();
                }

                // مطابقة الكود المدخل مع الكود في السطر
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
                farmerName: results[0].nom, // مطابقة لعمود nom في ملفك
                data: results
            });
        } else {
            res.status(404).json({ success: false, message: 'الكود غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل بنجاح على المنفذ ${PORT}`);
});
