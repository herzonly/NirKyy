const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');

const TARGET_DOMAIN = 'layarwibu.com';
const BYPASS_API_BASE_URL = 'https://express-vercel-ytdl.vercel.app/stream?q=';
const BASE_API_PATH = 'https://nirkyy.koyeb.app/api/v1/otakudesu';

async function fetchHtml(targetUrl, referer = null) {
  try {
    const headers = {
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      'Accept': 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    if (referer) headers['Referer'] = referer;
    const response = await axios.get(targetUrl, {
      headers,
      timeout: 30000,
      maxRedirects: 10,
      validateStatus: s => s >= 200 && s < 500
    });
    if (response.status >= 500) return null;
    return response.data;
  } catch {
    return null;
  }
}

function rewriteUrl(originalRelativeUrl) {
  if (!originalRelativeUrl || originalRelativeUrl === '#' || originalRelativeUrl.startsWith('http')) {
    return originalRelativeUrl;
  }
  const parsed = url.parse(originalRelativeUrl, true);
  const path = parsed.pathname;
  const query = parsed.query;
  let action = 'home';
  let id = null;
  if (path === '/') action = 'home';
  else if (path === '/genres') action = 'genres';
  else if (path.startsWith('/anime/')) { action = 'anime'; id = path.split('/').pop(); }
  else if (path.startsWith('/episode/')) { action = 'episode'; id = path.split('/').pop(); }
  else if (path.startsWith('/genres/')) { action = 'genre'; id = path.split('/').pop(); if (id === 'genres') id = null; }
  const params = { action };
  if (id) params.id = id;
  if (query.page && parseInt(query.page, 10) > 1) params.page = parseInt(query.page, 10);
  return `${BASE_API_PATH}?${new url.URLSearchParams(params).toString()}`;
}

async function scrapeHome(page = 1) {
  const suffix = page > 1 ? `?page=${page}` : '';
  const html = await fetchHtml(`https://${TARGET_DOMAIN}/${suffix}`, `https://${TARGET_DOMAIN}/`);
  if (!html) return { anime_list: [], pagination: null };
  const $ = cheerio.load(html);
  const animeList = [];
  $('.row .col-lg-2.col-md-3.col-sm-4.col-6').each((_, el) => {
    const card = $(el).find('.card');
    const link = card.find('a.btn').attr('href');
    const title = card.find('h6.card-title').text().trim();
    const img = card.find('img.card-img-top').attr('src');
    let id = null;
    if (link) {
      const m = link.match(/\/anime\/([^\/]+)/);
      if (m) id = m[1];
    }
    const info = {};
    card.find('p.card-text strong, p.card-text').contents().each((_, node) => {
      if (node.type === 'tag' && node.name === 'strong') info.currentKey = $(node).text().replace(':', '').trim();
      else if (node.type === 'text' && info.currentKey) {
        info[info.currentKey] = $(node).text().trim();
        info.currentKey = null;
      }
    });
    const display = {};
    if (info.Latest) display.Info1 = `Ep Baru: ${info.Latest}`;
    if (info['Aired Episodes']) display.Info2 = `${info['Aired Episodes']} Eps`;
    if (!Object.keys(display).length && info.Release) display.Info1 = `Rilis: ${info.Release}`;
    if (id && title) animeList.push({ id, title, image: img, info: display, link: rewriteUrl(link) });
  });
  const paginationNav = $('nav[aria-label="pagination"] ul.pagination');
  let pagination = null;
  if (paginationNav.length) {
    pagination = { current_page: page, pages: [], prev_page: null, prev_disabled: true, next_page: null, next_disabled: true };
    paginationNav.find('.page-item').each((_, el) => {
      const l = $(el).find('.page-link');
      const txt = l.text().trim();
      const href = l.attr('href');
      const disabled = $(el).hasClass('disabled');
      const tp = href ? parseInt(url.parse(href, true).query.page, 10) || 1 : null;
      if (txt.includes('Previous')) { pagination.prev_page = tp; pagination.prev_disabled = disabled; }
      else if (txt.includes('Next')) { pagination.next_page = tp; pagination.next_disabled = disabled; }
      else if (!isNaN(parseInt(txt, 10))) {
        pagination.pages.push({ number: parseInt(txt, 10), target_page: tp });
        if ($(el).hasClass('active')) pagination.current_page = parseInt(txt, 10);
      }
    });
    pagination.pages = pagination.pages.filter(p => p.target_page);
  }
  return { anime_list: animeList, pagination };
}

async function scrapeAnimeByGenre(slug, page = 1) {
  const suffix = page > 1 ? `?page=${page}` : '';
  const html = await fetchHtml(`https://${TARGET_DOMAIN}/genres/${slug}${suffix}`, `https://${TARGET_DOMAIN}/genres`);
  if (!html) return { anime_list: [], pagination: null };
  const $ = cheerio.load(html);
  const animeList = [];
  $('.row .col-lg-2.col-md-3.col-sm-4.col-6').each((_, el) => {
    const card = $(el).find('.card');
    const link = card.find('a.btn').attr('href');
    const title = card.find('h6.card-title').text().trim();
    const img = card.find('img.card-img-top').attr('src');
    let id = null;
    if (link) {
      const m = link.match(/\/anime\/([^\/]+)/);
      if (m) id = m[1];
    }
    const info = {};
    card.find('p.card-text strong, p.card-text').contents().each((_, node) => {
      if (node.type === 'tag' && node.name === 'strong') info.currentKey = $(node).text().replace(':', '').trim();
      else if (node.type === 'text' && info.currentKey) {
        info[info.currentKey] = $(node).text().trim();
        info.currentKey = null;
      }
    });
    const display = {};
    if (info.Rating) display.Info1 = `Rating: ${info.Rating}`;
    if (info.Studio) display.Info2 = `Studio: ${info.Studio}`;
    if (id && title) animeList.push({ id, title, image: img, info: display, link: rewriteUrl(link) });
  });
  const paginationNav = $('nav[aria-label="pagination"] ul.pagination');
  let pagination = null;
  if (paginationNav.length) {
    pagination = { current_page: page, pages: [], prev_page: null, prev_disabled: true, next_page: null, next_disabled: true };
    paginationNav.find('.page-item').each((_, el) => {
      const l = $(el).find('.page-link');
      const txt = l.text().trim();
      const href = l.attr('href');
      const disabled = $(el).hasClass('disabled');
      const tp = href ? parseInt(url.parse(href, true).query.page, 10) || 1 : null;
      if (txt.includes('Previous')) { pagination.prev_page = tp; pagination.prev_disabled = disabled; }
      else if (txt.includes('Next')) { pagination.next_page = tp; pagination.next_disabled = disabled; }
      else if (!isNaN(parseInt(txt, 10))) {
        pagination.pages.push({ number: parseInt(txt, 10), target_page: tp });
        if ($(el).hasClass('active')) pagination.current_page = parseInt(txt, 10);
      }
    });
    pagination.pages = pagination.pages.filter(p => p.target_page);
  }
  return { anime_list: animeList, pagination };
}

async function scrapeAnimeDetails(id) {
  const html = await fetchHtml(`https://${TARGET_DOMAIN}/anime/${id}`, `https://${TARGET_DOMAIN}/`);
  if (!html) return null;
  const $ = cheerio.load(html);
  const details = { info: {}, episodes: [] };
  details.info.image = $('.col-md-4 img').attr('src') || null;
  details.info.score = $('.position-absolute.top-0 span').text().trim() || 'N/A';
  details.info.status = $('.position-absolute.bottom-0 span').text().trim() || 'N/A';
  details.info.title = $('h1.display-4').text().trim() || 'N/A';
  $('.col-md-8 .my-3 p').each((_, el) => {
    const strongText = $(el).find('strong').text();
    const key = strongText.replace(':', '').trim();
    const fullText = $(el).text().trim();
    const val = fullText.substring(strongText.length).trim();
    if (key) details.info[key] = val || 'N/A';
  });
  details.info.genre = [];
  $('ul.list-inline a').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    const slug = href ? url.parse(href).pathname.split('/').pop() : null;
    if (name && href && slug && slug !== 'genres') details.info.genre.push({ name, link: rewriteUrl(href), slug });
  });
  let synopsis = $('div.my-4 p.text-justify').text().trim();
  if (!synopsis) synopsis = $('div.my-4 h4:contains("Sinopsis") + p').text().trim();
  details.info.synopsis = synopsis || 'N/A';
  const eps = [];
  $('.table-responsive table tbody tr').each((_, tr) => {
    const epTitle = $(tr).find('td:nth-child(1)').text().trim();
    const epLink = $(tr).find('td.text-center a').attr('href');
    let epId = null;
    if (epLink) {
      const m = epLink.match(/\/episode\/([^\/]+)/);
      if (m) epId = m[1];
    }
    if (epId && epTitle) eps.push({ id: epId, title: epTitle, link: rewriteUrl(epLink) });
  });
  details.episodes = eps.reverse();
  return details;
}

async function scrapeEpisodePage(id) {
  const html = await fetchHtml(`https://${TARGET_DOMAIN}/episode/${id}`, `https://${TARGET_DOMAIN}/`);
  if (!html) return null;
  const $ = cheerio.load(html);
  const data = { title: 'N/A', anime_title: 'N/A', iframe_src: null, stream_servers: [], download_links: {}, prev_episode: null, next_episode: null };
  const pageTitle = $('title').text().trim();
  data.title = pageTitle ? pageTitle.replace(/ - .*$/, '').trim() : $('h1, h2, div.title h3').first().text().trim() || 'N/A';
  const bc = $('nav[aria-label="breadcrumb"] li:nth-last-child(2) a, h1[itemprop="itemReviewed"], div.anime-info h2').first().text().trim();
  data.anime_title = bc || data.title.replace(/ Episode\s*\d+\s*$/i, '').trim();
  let iframeSrc = $('iframe#streaming-iframe').attr('src') || $('iframe#streaming-iframe').attr('data-src');
  data.iframe_src = iframeSrc || null;
  $('#streaming-source option').each((_, el) => {
    const val = $(el).attr('value');
    const txt = $(el).text().trim();
    if (val && val !== 'default' && txt !== 'Default Source') data.stream_servers.push({ id: `https://nirkyy.koyeb.app/api/v1/otakudesu?action=get_server_url&server_id=${val}`, name: txt });
  });
  if (data.iframe_src) data.stream_servers.unshift({ id: data.iframe_src, name: 'Default Server (Original)' });
  $('.table-responsive table.table-bordered tbody tr').each((_, tr) => {
    const quality = $(tr).find('td:nth-child(1) span.badge, td:nth-child(1)').first().text().trim();
    const size = $(tr).find('td:nth-child(2)').first().text().trim();
    const links = [];
    $(tr).find('td:nth-child(3) a').each((__, a) => {
      const href = $(a).attr('href');
      const txt = $(a).text().trim().replace($(a).find('i').text().trim(), '').trim();
      if (href && href !== '#') links.push({ provider: txt, url: href });
    });
    if (quality && links.length) data.download_links[quality] = { size, links };
  });
  if (!Object.keys(data.download_links).length) {
    $('.download li, .download-links .item').each((_, el) => {
      const q = $(el).find('strong, .quality').first().text().replace(':', '').trim();
      const lks = [];
      $(el).find('a').each((__, a) => {
        const href = $(a).attr('href');
        const txt = $(a).text().trim().replace($(a).find('i').text().trim(), '').trim();
        if (href && href !== '#') lks.push({ provider: txt, url: href });
      });
      const sz = $(el).find('.size').first().text().trim();
      if (q && lks.length) data.download_links[q] = { size: sz, links: lks };
    });
  }
  $('div.d-flex.justify-content-between a.btn, div.episode-nav a').each((_, navLink) => {
    const href = $(navLink).attr('href');
    if (!href || $(navLink).hasClass('disabled')) return;
    const txt = $(navLink).text().trim();
    const m = href.match(/\/episode\/([^\/]+)/);
    if (m) {
      const navId = m[1];
      if (txt.includes('Prev') || txt.includes('Sebelumnya')) data.prev_episode = { id: navId, link: rewriteUrl(href) };
      if (txt.includes('Next') || txt.includes('Selanjutnya')) data.next_episode = { id: navId, link: rewriteUrl(href) };
    }
  });
  return data;
}

async function searchAnime(q) {
  if (!q) return [];
  const json = await fetchHtml(`https://${TARGET_DOMAIN}/search-ajax?q=${encodeURIComponent(q)}&page=1&limit=20`, `https://${TARGET_DOMAIN}/`);
  if (!json) return [];
  try {
    const data = json;
    if (Array.isArray(data.results)) {
      return data.results.map(r => ({
        ...r,
        link: r.animeId ? rewriteUrl(`/anime/${r.animeId}`) : rewriteUrl(r.href)
      }));
    }
  } catch {}
  return [];
}

async function scrapeGenreList() {
  const html = await fetchHtml(`https://${TARGET_DOMAIN}/genres`, `https://${TARGET_DOMAIN}/`);
  if (!html) return [];
  const $ = cheerio.load(html);
  const genres = [];
  $('ul.list-group li a').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    const slug = href ? url.parse(href).pathname.split('/').pop() : null;
    if (name && slug && slug !== 'genres') genres.push({ name, slug, link: rewriteUrl(href) });
  });
  return genres;
}

module.exports = async (req, res) => {
  const action = req.query.action || 'home';
  const id = req.query.id;
  const query = req.query.q;
  const serverId = req.query.server_id;
  const page = parseInt(req.query.page, 10) || 1;
  res.setHeader('Content-Type', 'application/json');
  try {
    switch (action) {
      case 'home':
        res.successJson(await scrapeHome(page));
        break;
      case 'anime':
        if (!id) return res.errorJson('Parameter ID anime hilang.');
        const anime = await scrapeAnimeDetails(id);
        if (anime) res.successJson(anime);
        else res.errorJson('Gagal memuat detail anime atau tidak ditemukan.', 404);
        break;
      case 'episode':
        if (!id) return res.errorJson('Parameter ID episode hilang.');
        const episode = await scrapeEpisodePage(id);
        if (episode) res.successJson(episode);
        else res.errorJson('Gagal memuat data episode atau tidak ditemukan.', 404);
        break;
      case 'search':
        if (!query) return res.errorJson('Parameter query (q) hilang.');
        res.successJson(await searchAnime(query));
        break;
      case 'genres':
        res.successJson(await scrapeGenreList());
        break;
      case 'genre':
        if (!id) return res.errorJson('Parameter ID genre (slug) hilang.');
        const genreData = await scrapeAnimeByGenre(id, page);
        if (genreData) {
          genreData.genre_slug = id;
          res.successJson(genreData);
        } else res.errorJson(`Gagal memuat anime untuk genre "${id}" atau genre tidak ditemukan.`, 404);
        break;
      case 'get_server_url':
        if (!serverId) return res.errorJson('Parameter server_id hilang.');
        try {
          const resp = await axios.get(BYPASS_API_BASE_URL + encodeURIComponent(serverId), { timeout: 20000 });
          if (resp.data && resp.data.url) res.redirect(resp.data.url);
          else res.errorJson('Endpoint bypass mengembalikan format tidak valid.', 502);
        } catch (err) {
          const statusCode = err.response ? err.response.status : 500;
          const msg = err.response?.data?.error || err.message;
          res.errorJson(msg, statusCode >= 500 ? statusCode : 502);
        }
        break;
      case 'history':
        res.successJson([]);
        break;
      default:
        res.successJson(await scrapeHome(page));
        break;
    }
  } catch {
    res.errorJson('Terjadi kesalahan internal server.', 500);
  }
};