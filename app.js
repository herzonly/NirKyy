const express = require('express');
const fs = require('fs');
const path = require('path');
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
    console.log(`Berhasil memuat ${dataJson.fitur.length} endpoint dari ${ENDPOINTS_FILE}`);
} catch (err) {
    console.error(`Error saat membaca atau mem-parse file endpoint (${ENDPOINTS_FILE}):`, err);
}

const endpoints = dataJson.fitur;
const daftarTags = dataJson.daftarTags;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

function generateEndpointsHTML(data) {
    if (!data || data.length === 0) {
        return '<p class="text-center text-secondary fst-italic mt-4">Tidak ada endpoint yang cocok ditemukan.</p>';
    }

    let html = '<div class="row">';
    data.forEach(ep => {
        const name = ep.nama || 'Unnamed Endpoint';
        const path = ep.endpoint || '/error-missing-path';
        const tags = (Array.isArray(ep.tags) ? ep.tags : []).filter(t => t && typeof t === 'string');

        html += `
        <div class="col-lg-6 mb-4">
            <div class="card h-100 shadow-sm">
                <div class="card-header">${name}</div>
                <div class="card-body d-flex flex-column">
                    <div class="endpoint-path mb-3">
                        <span class="text-monospace">${path}</span>
                         <div class="btn-group ms-2" role="group" aria-label="Endpoint Actions">
                             <button class="btn btn-sm btn-outline-secondary btn-copy" data-clipboard-text="https://nirkyy.koyeb.app${path}" title="Salin Full URL">
                                 <i class="far fa-copy"></i> URL
                             </button>
                             <button class="btn btn-sm btn-primary try-button" data-endpoint='${JSON.stringify(ep).replace(/'/g, "'")}' title="Coba Endpoint Ini">
                                 <i class="fas fa-vial"></i> Coba
                             </button>
                         </div>
                    </div>
                    ${ep.deskripsi ? `<p class="card-text text-secondary mb-2 flex-grow-1">${ep.deskripsi}</p>` : '<p class="card-text text-secondary mb-2 flex-grow-1 fst-italic">Tidak ada deskripsi.</p>'}
                    <div class="mt-auto">
                        ${tags.map(t => `<span class="badge me-1 mb-1">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>`;
    });
    html += '</div>';
    return html;
}

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

app.get('/', (req, res) => { res.render('index'); });

app.get('/tags', (req, res) => {
    res.json({ tags: uniqueTags });
});

app.get('/renderpage', (req, res) => {
    const { tags = '' } = req.query;
    const filtered = filterEndpoints(endpoints, { tags });
    const htmlSnippet = generateEndpointsHTML(filtered);
    res.send(htmlSnippet);
});

app.get('/search', (req, res) => {
    const { term = '' } = req.query;
    const filtered = filterEndpoints(endpoints, { term });
    const htmlSnippet = generateEndpointsHTML(filtered);
    res.send(htmlSnippet);
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

