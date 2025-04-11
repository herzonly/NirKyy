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
    <title>Render Page by Tags - NirKyy API</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">

    <style>
      :root {
        --bs-body-bg: #1a1d24; /* Dark background */
        --bs-body-color: #e0e0e0; /* Light text */
        --bs-primary: #0d6efd; /* Bootstrap Blue */
        --bs-secondary: #6c757d; /* Bootstrap Gray */
        --card-bg: #2c303a; /* Slightly lighter card background */
        --border-color: #444;
      }
      body {
        font-family: 'Poppins', sans-serif;
        background-color: var(--bs-body-bg);
        color: var(--bs-body-color);
      }
      .card {
          background-color: var(--card-bg);
          border: 1px solid var(--border-color);
      }
      .card-header {
          background-color: rgba(0,0,0,0.1);
          border-bottom: 1px solid var(--border-color);
      }
      h1, h2, h3, h4, h5, h6 {
         color: #ffffff; /* Brighter headings */
      }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h1 class="mb-4">API Endpoints: ${tags || 'All Tags'}</h1>
        <div class="row">
            ${htmlSnippet} 
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
</body>
</html>`;

  res.send(fullHTML);
});

app.use((req, res, next) => { res.status(404).render('404'); });
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).render('500'); });

app.listen(port, () => { console.log(`Server berjalan di http://localhost:${port}`); });