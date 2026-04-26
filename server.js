import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.static(__dirname));

app.get('/api/search/:code', (req, res) => {
    const results = [];
    fs.createReadStream(path.join(__dirname, 'deliveries.csv'))
        .pipe(csv({ separator: ';' }))
        .on('data', (data) => {
            if (data.CodePart && data.CodePart.trim() === req.params.code.trim()) {
                results.push(data);
            }
        })
        .on('end', () => {
            if (results.length > 0) {
                res.json({ success: true, farmerName: results[0].Nom, data: results });
            } else {
                res.json({ success: false });
            }
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
