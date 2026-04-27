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
            .pipe(csv({ 
                separator: ',',
                mapHeaders: ({ header }) => header.replace(/['"]+/g, '').trim() 
            })) 
            .on('data', (row) => {
                let rowCode = row.CodePart ? row.CodePart.toString().replace(/['"]+/g, '').trim() : "";
                
                // معالجة الأرقام العلمية الطويلة
                if (rowCode.includes('E+')) {
                    try { rowCode = BigInt(Math.round(Number(rowCode))).toString(); } catch(e) {}
                }

                if (rowCode === targetCode.trim()) {
                    // تنظيف جميع القيم في السطر من علامات الاقتباس
                    Object.keys(row).forEach(key => {
                        if(typeof row[key] === 'string') row[key] = row[key].replace(/['"]+/g, '').trim();
                    });
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
                farmerName: results[0].nom,
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
app.listen(PORT, () => { console.log(`✅ السيرفر يعمل على المنفذ ${PORT}`); });
