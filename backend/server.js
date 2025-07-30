const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json());

const dbPath = path.resolve(__dirname, 'database/cezalar.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    else console.log('SQLite veritabanına bağlanıldı.');
});

db.run(`CREATE TABLE IF NOT EXISTS cezalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kisi TEXT NOT NULL,
    icecek TEXT NOT NULL,
    tarih DATE DEFAULT (datetime('now','localtime')),
    odendi INTEGER DEFAULT 0
)`);

app.get('/api/cezalar', (req, res) => {
    db.all("SELECT * FROM cezalar WHERE odendi = 0 ORDER BY tarih DESC", [], (err, rows) => {
        if (err) res.status(500).json({ "error": err.message });
        else res.json({ data: rows });
    });
});

app.post('/api/cezalar', (req, res) => {
    const { kisi, icecek } = req.body;
    db.run(`INSERT INTO cezalar (kisi, icecek) VALUES (?, ?)`, [kisi, icecek], function(err) {
        if (err) res.status(400).json({ "error": err.message });
        else res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/cezalar/:id/odendi', (req, res) => {
    db.run(`UPDATE cezalar SET odendi = 1 WHERE id = ?`, [req.params.id], (err) => {
        if (err) res.status(400).json({ "error": err.message });
        else res.json({ "message": "success" });
    });
});

app.listen(PORT, () => {
    console.log(`Backend sunucusu ${PORT} portunda çalışıyor.`);
});