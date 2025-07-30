// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json());

// Veritabanı bağlantısı
const dbPath = path.resolve(__dirname, 'database/cezalar.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    else console.log('SQLite veritabanına bağlanıldı.');
});

// Tüm tabloları oluştur (eğer yoksa)
db.serialize(() => {
    // 1. Cezalar Tablosu
    db.run(`CREATE TABLE IF NOT EXISTS cezalar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kisi TEXT NOT NULL,
        icecek TEXT NOT NULL,
        tarih DATE DEFAULT (datetime('now','localtime')),
        odendi INTEGER DEFAULT 0
    )`);

    // 2. Kişiler Tablosu (YENİ)
    db.run(`CREATE TABLE IF NOT EXISTS kisiler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad_soyad TEXT NOT NULL UNIQUE
    )`);

    // 3. İçecekler Tablosu (YENİ)
    db.run(`CREATE TABLE IF NOT EXISTS icecekler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL UNIQUE
    )`);
});


// --- CEZA API'LARI ---
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


// --- KİŞİ YÖNETİMİ API'LARI (YENİ) ---
app.get('/api/kisiler', (req, res) => {
    db.all("SELECT * FROM kisiler ORDER BY ad_soyad", [], (err, rows) => {
        if (err) res.status(500).json({ "error": err.message });
        else res.json({ data: rows });
    });
});

app.post('/api/kisiler', (req, res) => {
    const { ad_soyad } = req.body;
    db.run(`INSERT INTO kisiler (ad_soyad) VALUES (?)`, [ad_soyad], function(err) {
        if (err) res.status(400).json({ "error": err.message });
        else res.status(201).json({ id: this.lastID });
    });
});

// --- İÇECEK YÖNETİMİ API'LARI (YENİ) ---
app.get('/api/icecekler', (req, res) => {
    db.all("SELECT * FROM icecekler ORDER BY ad", [], (err, rows) => {
        if (err) res.status(500).json({ "error": err.message });
        else res.json({ data: rows });
    });
});

app.post('/api/icecekler', (req, res) => {
    const { ad } = req.body;
    db.run(`INSERT INTO icecekler (ad) VALUES (?)`, [ad], function(err) {
        if (err) res.status(400).json({ "error": err.message });
        else res.status(201).json({ id: this.lastID });
    });
});


app.listen(PORT, () => {
    console.log(`Backend sunucusu ${PORT} portunda çalışıyor.`);
});
