const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const succesJson = (json) => ({ published_By:"NirKyy",success: true, data: json });
const errorJson = (json) => ({ published_By:"NirKyy", success: false, error: json });

app.use((req, res, next) => {
  res.succesJson = (json) => res.status(200).json(succesJson(json));
  res.errorJson = (json, status) => res.status(status||500).json(errorJson(json));
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('json spaces', 2);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const endpoints = require('./list.json');

function getUniqueTags(data) {
  const tags = new Set();
  data.forEach(ep => {
    if (ep.tags && Array.isArray(ep.tags)) {
      ep.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
}
const uniqueTags = getUniqueTags(endpoints);

function generateEndpointsHTML(data) {
  let html = '<div class="row">';
  data.forEach(ep => {
    html += `<div class="col-md-6 mb-3">
      <div class="card mb-3" style="border:1px solid #39ff14;background-color:#1a1a1a;color:#39ff14;">
        <div class="card-header" style="background-color:#0f0f0f;color:#00ffff;">${ep.nama}</div>
        <div class="card-body">
          <div class="mb-2">
            ${(ep.tags || []).map(t => `<span class="badge badge-secondary mr-1" style="background-color:#ff00ff;color:#fff;"><i class="fas fa-hashtag"></i> ${t}</span>`).join('')}
          </div>
          <div class="bg-dark p-2 mb-2" style="font-size:0.9em;overflow-x:auto;">${ep.endpoint}</div>
          <div class="d-flex justify-content-end">
            <button class="btn btn-outline-info btn-sm mr-2 copy-url-button" data-url="${ep.endpoint}"><i class="fas fa-copy"></i> Copy URL</button>
            <button class="btn btn-info btn-sm try-button" data-endpoint='${JSON.stringify(ep)}'><i class="fas fa-play"></i> Try</button>
          </div>
        </div>
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

function filterEndpointsByTerm(term) {
  if (!term) return endpoints;
  const lowerTerm = term.toLowerCase();
  return endpoints.filter(ep =>
    ep.nama.toLowerCase().includes(lowerTerm) ||
    ep.endpoint.toLowerCase().includes(lowerTerm) ||
    ep.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
  );
}

function filterEndpointsByTags(tags) {
  if (!tags) return endpoints;
  const arrTags = tags.split(',').map(t => t.trim().toLowerCase());
  return endpoints.filter(ep => ep.tags.some(tag => arrTags.includes(tag.toLowerCase())));
}

app.use("/api/v1", require("./API/index.js"));

app.get('/', (req, res) => { res.render('index'); });

app.get('/tags', (req, res) => {
  res.json({ tags: uniqueTags });
});

app.get('/search', (req, res) => {
  const term = req.query.term || '';
  const filtered = filterEndpointsByTerm(term);
  const htmlSnippet = generateEndpointsHTML(filtered);
  res.send(htmlSnippet);
});

app.get('/renderpage', (req, res) => {
  const tags = req.query.tags || '';
  const filtered = filterEndpointsByTags(tags);
  const htmlSnippet = generateEndpointsHTML(filtered);
  const fullHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Render Page by Tags</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
  <div class="container mt-5">
    <h1>Hasil Render by Tags: ${tags || 'Semua'}</h1>
    ${htmlSnippet}
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
  res.send(fullHTML);
});


app.use((req, res, next) => { res.status(404).render('404'); });
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).render('500'); });

app.listen(port, () => { console.log(`Server berjalan di http://localhost:${port}`); });