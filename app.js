const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const succesJson = (json) => { return { author: "NirKyy", success: true, data: json }; };
const errorJson = (json) => { return { author: "NirKyy", success: false, error: json }; };
app.use((req, res, next) => {
  res.succesJson = (json) => { res.status(200).json(succesJson(json)); };
  res.errorJson = (json) => { res.json(errorJson(json)); };
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.set('json spaces', 2);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const endpoints = require('./list.json');
function getUniqueTags(data) {
  let tags = new Set();
  data.forEach(ep => { if (ep.tags && Array.isArray(ep.tags)) { ep.tags.forEach(tag => tags.add(tag)); } });
  return Array.from(tags).sort();
}
function generateEndpointsHTML(data) {
  let html = '<div class="row">';
  data.forEach(ep => {
    html += `<div class="col-md-6 mb-3">
      <div class="card mb-3" style="border:1px solid #00ff7f;background-color:#222;color:#00ff7f;">
        <div class="card-header" style="background-color:#333;color:#00ffff;">${ep.nama}</div>
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
  return endpoints.filter(ep => {
    const namaMatch = ep.nama.toLowerCase().includes(lowerTerm);
    const endpointMatch = ep.endpoint.toLowerCase().includes(lowerTerm);
    const tagsMatch = ep.tags.some(tag => tag.toLowerCase().includes(lowerTerm));
    return namaMatch || endpointMatch || tagsMatch;
  });
}
function filterEndpointsByTags(tags) {
  if (!tags) return endpoints;
  const arrTags = tags.split(',').map(t => t.trim().toLowerCase());
  return endpoints.filter(ep => ep.tags.some(tag => arrTags.includes(tag.toLowerCase())));
}
app.use("/api/v1", require("./API/index.js"));
app.get('/', (req, res) => { res.render('index', { tags: getUniqueTags(endpoints) }); });
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
<title>Render Page by Tags</title>
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
<style>body { background-color: #111; color: #00ff7f; font-family: 'Orbitron', sans-serif; }</style>
</head>
<body>
<div class="container">
<h1>Hasil Render by Tags: ${tags || 'All'}</h1>
${htmlSnippet}
</div>
</body>
</html>`;
  res.send(fullHTML);
});
app.use((req, res, next) => { res.status(404).render('404'); });
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).render('500'); });
app.listen(port, () => { console.log(`Server berjalan di http://localhost:${port}`); });