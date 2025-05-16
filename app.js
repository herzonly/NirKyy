const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const path = require('path');
const axios = require('axios');
const API = require('./API/index.js');

const app = express();
const port = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, 'public');
const VIEWS_DIR = path.join(__dirname, 'views');
const ENDPOINTS_FILE = path.join(__dirname, 'list.json');

let dataJson = { daftarTags: [], fitur: [] };
try {
    const rawData = fs.readFileSync(ENDPOINTS_FILE, 'utf-8');
    dataJson = JSON.parse(rawData);
} catch (err) {
    console.error(`Error saat membaca atau mem-parse file endpoint (${ENDPOINTS_FILE}):`, err);
}

const endpoints = dataJson.fitur;
const daftarTags = dataJson.daftarTags;

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: 'Terlalu banyak Melakukan permintaan, Silahkan tunggu beberapa menit',
});

const counterMiddleware = (req, res, next) => {
    axios.get('https://copper-ambiguous-velvet.glitch.me/up', {
            timeout: 5000
        })
        .catch(error => {
            console.error('Terjadi kesalahan saat mengirim permintaan Axios:', error.message);
        });
    next();
};

app.set('trust proxy', 1);
app.use(apiLimiter);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
    } else {
        next();
    }
});

app.use("/api/v1", counterMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('json spaces', 2);

app.use((req, res, next) => {
    res.succesJson = (data, statusCode = 200) => res.status(statusCode).json({ published_By: "NirKyy", success: true, data: data });
    res.successJson = (data, statusCode = 200) => res.status(statusCode).json({ published_By: "NirKyy", success: true, data: data });
    res.errorJson = (message, statusCode = 500) => res.status(statusCode).json({ published_By: "NirKyy", success: false, status: statusCode, error: message });
    next();
});

app.use("/api/v1", API);
app.use(express.static(PUBLIC_DIR));

app.set('view engine', 'ejs');
app.set('views', VIEWS_DIR);

function getUniqueTags(data) {
    const tags = new Set();
    data.forEach(ep => {
        if (ep.tags && Array.isArray(ep.tags)) {
            ep.tags.forEach(tag => {
                if (tag && typeof tag === 'string') {
                    tags.add(tag.trim());
                }
            });
        }
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

const uniqueTags = daftarTags;

function filterEndpoints(data, { term, tags }) {
    let filteredData = data;
    
    if (tags) {
        const lowerTags = tags.toLowerCase().split(',').map(t => t.trim()).filter(t => t);
        if (lowerTags.length > 0) {
            filteredData = filteredData.filter(ep =>
                ep.tags && Array.isArray(ep.tags) && ep.tags.some(tag => lowerTags.includes(tag.toLowerCase()))
            );
        }
    }
    
    if (term) {
        const lowerTerm = term.toLowerCase();
        filteredData = filteredData.filter(ep =>
            (ep.nama && ep.nama.toLowerCase().includes(lowerTerm)) ||
            (ep.endpoint && ep.endpoint.toLowerCase().includes(lowerTerm)) ||
            (ep.deskripsi && ep.deskripsi.toLowerCase().includes(lowerTerm)) ||
            (ep.tags && Array.isArray(ep.tags) && ep.tags.some(tag => tag.toLowerCase().includes(lowerTerm)))
        );
    }
    
    return filteredData;
}

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/tags', (req, res) => {
    res.json({ tags: uniqueTags });
});

app.get('/renderpage', (req, res) => {
    const { tags = '' } = req.query;
    const filtered = filterEndpoints(endpoints, { tags });
    res.json({ endpoints: filtered });
});

app.get('/search', (req, res) => {
    const { term = '' } = req.query;
    const filtered = filterEndpoints(endpoints, { term });
    res.json({ endpoints: filtered });
});

app.use((req, res, next) => {
    if (req.accepts('html')) {
        res.status(404).render('404');
    } else {
        res.errorJson('Not Found', 404);
    }
});

app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err);
    if (req.accepts('html')) {
        res.status(500).render('500');
    } else {
        res.errorJson('Internal Server Error', 500);
    }
});

app.listen(port, () => {
    console.log(`🚀 Server berjalan di http://localhost:${port}`);
});