import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// إعدادات الوصول العام (CORS) والملفات الثابتة
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

// دالة البحث في ملف CSV
const findDeliveries = (targetCode) => {
    return new Promise((resolve, reject) => {
        const results = [];
        // التأكد من البحث عن ملف deliveries.csv المرفوع في المستودع
        const filePath = path.join(__dirname, 'deliveries.csv');

        if (!fs.existsSync(filePath)) {
            return reject('خطأ: ملف البيانات deliveries.csv غير موجود على السيرفر');
        }

        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' })) // استخدام الفاصلة المنقوطة كما في ملفاتك الأصلية
            .on('data', (row) => {
                // مطابقة كود الشريك مع إزالة الفراغات الزائدة
                if (row.CodePart && row.CodePart.trim() === targetCode.trim()) {
                    results.push(row);
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

// رابط البحث (API) الذي سيتصل به ملف index.html
app.get('/api/search/:code', async (req, res) => {
    try {
        const results = await findDeliveries(req.params.code);
        if (results.length > 0) {
            res.json({
                success: true,
                farmerName: results[0].Nom, // جلب اسم الفلاح من أول نتيجة
                data: results
            });
        } else {
            res.json({ success: false, message: 'الكود غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- إعدادات التشغيل الخاصة بـ Render ---

// 1. استخدام المنفذ الديناميكي الذي توفره المنصة تلقائياً
const PORT = process.env.PORT || 3001; 

// 2. تشغيل السيرفر على العنوان '0.0.0.0' ليكون متاحاً عالمياً
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ النظام جاهز للعمل على الإنترنت!`);
    console.log(`➜ المنفذ النشط: ${PORT}`);
});
