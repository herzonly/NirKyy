const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');

const TARGET_DOMAIN = 'layarwibu.com';
const BYPASS_API_BASE_URL = 'https://express-vercel-ytdl.vercel.app/stream?q=';
const BASE_API_PATH = 'https://nirkyy.koyeb.app/api/v1/otakudesu';

const fetchHtml = async (targetUrl, referer = null) => {
    try {
        const headers = {
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
            'Accept': 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
        if (referer) {
            headers['Referer'] = referer;
        }

        const response = await axios.get(targetUrl, {
            headers: headers,
            timeout: 30000,
            maxRedirects: 10,
            validateStatus: (status) => status >= 200 && status < 500,
        });

        if (response.status >= 500) {
            console.error(`Error fetching ${targetUrl}: HTTP Status ${response.status}`);
            return null;
        }

        return response.data;

    } catch (error) {
        console.error(`Axios error fetching ${targetUrl}:`, error.message);
        return null;
    }
};

const rewriteUrl = (originalRelativeUrl) => {
    if (!originalRelativeUrl || originalRelativeUrl === '#' || originalRelativeUrl.startsWith('http')) {
        return originalRelativeUrl;
    }

    const parsedUrl = url.parse(originalRelativeUrl, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    let newAction = 'home';
    let newId = null;
    let page = query.page ? parseInt(query.page, 10) : null;

    if (pathname === '/') {
        newAction = 'home';
    } else if (pathname === '/genres') {
        newAction = 'genres';
    } else if (pathname.startsWith('/anime/')) {
        newAction = 'anime';
        newId = pathname.split('/').pop();
    } else if (pathname.startsWith('/episode/')) {
        newAction = 'episode';
        newId = pathname.split('/').pop();
    } else if (pathname.startsWith('/genres/')) {
        newAction = 'genre';
        newId = pathname.split('/').pop();
        if (newId === 'genres') newId = null;
    }


    const apiParams = { action: newAction };
    if (newId) {
        apiParams.id = newId;
    }
    if (page && page > 1) {
        apiParams.page = page;
    }

    return `${BASE_API_PATH}?${new url.URLSearchParams(apiParams).toString()}`;
};


const scrapeHome = async (page = 1) => {
    const pageParam = page > 1 ? `?page=${page}` : '';
    const targetUrl = `https://${TARGET_DOMAIN}/${pageParam}`;
    const html = await fetchHtml(targetUrl, `https://${TARGET_DOMAIN}/`);

    if (!html) {
        return { anime_list: [], pagination: null };
    }

    const $ = cheerio.load(html);
    const animeList = [];

    $('.row .col-lg-2.col-md-3.col-sm-4.col-6').each((i, el) => {
        const card = $(el).find('.card');
        if (card.length === 0) return;

        const linkNode = card.find('a.btn');
        const titleNode = card.find('h6.card-title');
        const imgNode = card.find('img.card-img-top');
        const infoNodes = card.find('p.card-text strong, p.card-text').contents();

        const detailLink = linkNode.attr('href');
        const title = titleNode.text().trim() || 'N/A';
        const imgSrc = imgNode.attr('src') || 'placeholder.jpg';

        let id = null;
        if (detailLink) {
            const idMatch = detailLink.match(/\/anime\/([^\/]+)/);
            if (idMatch && idMatch[1]) {
                id = idMatch[1];
            }
        }

        const info = {};
        let currentKey = null;
        infoNodes.each((j, node) => {
            const nodeType = node.type;
            if (nodeType === 'tag' && node.name === 'strong') {
                 currentKey = $(node).text().replace(':', '').trim();
            } else if (nodeType === 'text' && currentKey) {
                const value = $(node).text().trim();
                 if (value) {
                    info[currentKey] = value;
                    currentKey = null;
                }
            }
        });

        const displayInfo = {};
        if(info['Latest']) displayInfo['Info1'] = "Ep Baru: " + info['Latest'];
        if(info['Aired Episodes']) displayInfo['Info2'] = info['Aired Episodes'] + " Eps";
        if (Object.keys(displayInfo).length === 0 && info['Release']) displayInfo['Info1'] = "Rilis: " + info['Release'];


        if (id && title !== 'N/A') {
            animeList.push({
                id: id,
                title: title,
                image: imgSrc,
                info: displayInfo,
                link: rewriteUrl(detailLink),
            });
        }
    });

    let pagination = null;
    const paginationNav = $('nav[aria-label="pagination"] ul.pagination');
    if (paginationNav.length > 0) {
        pagination = {
            current_page: page,
            pages: [],
            prev_page: null,
            prev_disabled: true,
            next_page: null,
            next_disabled: true,
        };

        paginationNav.find('.page-item').each((i, el) => {
            const link = $(el).find('.page-link');
            if (link.length === 0) return;

            const linkText = link.text().trim();
            const linkHref = link.attr('href');
            const isDisabled = $(el).hasClass('disabled');

            const targetPage = linkHref ? parseInt(url.parse(linkHref, true).query.page, 10) || 1 : null;


            if (linkText.includes('Previous')) {
                pagination.prev_page = targetPage;
                pagination.prev_disabled = isDisabled;
            } else if (linkText.includes('Next')) {
                pagination.next_page = targetPage;
                pagination.next_disabled = isDisabled;
            } else if (!isNaN(parseInt(linkText, 10))) {
                const pageNum = parseInt(linkText, 10);
                pagination.pages.push({
                    number: pageNum,
                    target_page: targetPage ?? pageNum,
                });
                 if ($(el).hasClass('active')) {
                    pagination.current_page = pageNum;
                }
            }
        });
        pagination.current_page = Math.max(1, pagination.current_page);
        pagination.pages = pagination.pages.filter(p => p.target_page !== null && p.target_page > 0);
    }


    return { anime_list: animeList, pagination: pagination };
};

const scrapeAnimeByGenre = async (genreSlug, page = 1) => {
    const pageParam = page > 1 ? `?page=${page}` : '';
    const targetUrl = `https://${TARGET_DOMAIN}/genres/${genreSlug}${pageParam}`;
    const html = await fetchHtml(targetUrl, `https://${TARGET_DOMAIN}/genres`);

     if (!html) {
        return { anime_list: [], pagination: null };
    }

    const $ = cheerio.load(html);
    const animeList = [];

    $('.row .col-lg-2.col-md-3.col-sm-4.col-6').each((i, el) => {
        const card = $(el).find('.card');
        if (card.length === 0) return;

        const linkNode = card.find('a.btn');
        const titleNode = card.find('h6.card-title');
        const imgNode = card.find('img.card-img-top');
        const infoNodes = card.find('p.card-text strong, p.card-text').contents();

        const detailLink = linkNode.attr('href');
        const title = titleNode.text().trim() || 'N/A';
        const imgSrc = imgNode.attr('src') || 'placeholder.jpg';

        let id = null;
        if (detailLink) {
            const idMatch = detailLink.match(/\/anime\/([^\/]+)/);
            if (idMatch && idMatch[1]) {
                id = idMatch[1];
            }
        }

        const info = {};
        let currentKey = null;
        infoNodes.each((j, node) => {
             const nodeType = node.type;
            if (nodeType === 'tag' && node.name === 'strong') {
                 currentKey = $(node).text().replace(':', '').trim();
            } else if (nodeType === 'text' && currentKey) {
                const value = $(node).text().trim();
                 if (value) {
                    info[currentKey] = value;
                    currentKey = null;
                }
            }
        });


        const displayInfo = {};
        if(info['Rating'] && info['Rating'].trim()) displayInfo['Info1'] = "Rating: " + info['Rating'].trim();
        if(info['Studio']) displayInfo['Info2'] = "Studio: " + info['Studio'].trim();


        if (id && title !== 'N/A') {
            animeList.push({
                id: id,
                title: title,
                image: imgSrc,
                info: displayInfo,
                link: rewriteUrl(detailLink),
            });
        }
    });

    let pagination = null;
    const paginationNav = $('nav[aria-label="pagination"] ul.pagination');
    if (paginationNav.length > 0) {
        pagination = {
            current_page: page,
            pages: [],
            prev_page: null,
            prev_disabled: true,
            next_page: null,
            next_disabled: true,
        };

        paginationNav.find('.page-item').each((i, el) => {
            const link = $(el).find('.page-link');
            if (link.length === 0) return;

            const linkText = link.text().trim();
            const linkHref = link.attr('href');
            const isDisabled = $(el).hasClass('disabled');

             const targetPage = linkHref ? parseInt(url.parse(linkHref, true).query.page, 10) || 1 : null;

            if (linkText.includes('Previous')) {
                pagination.prev_page = targetPage;
                pagination.prev_disabled = isDisabled;
            } else if (linkText.includes('Next')) {
                pagination.next_page = targetPage;
                pagination.next_disabled = isDisabled;
            } else if (!isNaN(parseInt(linkText, 10))) {
                const pageNum = parseInt(linkText, 10);
                pagination.pages.push({
                    number: pageNum,
                    target_page: targetPage ?? pageNum,
                });
                 if ($(el).hasClass('active')) {
                    pagination.current_page = pageNum;
                }
            }
        });
         pagination.current_page = Math.max(1, pagination.current_page);
         pagination.pages = pagination.pages.filter(p => p.target_page !== null && p.target_page > 0);
    }

    return { anime_list: animeList, pagination: pagination };
};


const scrapeAnimeDetails = async (animeId) => {
    const targetUrl = `https://${TARGET_DOMAIN}/anime/${animeId}`;
    const html = await fetchHtml(targetUrl, `https://${TARGET_DOMAIN}/`);

    if (!html) {
        return null;
    }

    const $ = cheerio.load(html);
    const details = { info: {}, episodes: [] };

    details.info.image = $('.col-md-4 img').attr('src') || null;
    details.info.score = $('.position-absolute.top-0 span').text().trim() || 'N/A';
    details.info.status = $('.position-absolute.bottom-0 span').text().trim() || 'N/A';
    details.info.title = $('h1.display-4').text().trim() || 'N/A';

    $('.col-md-8 .my-3 p').each((i, el) => {
        const strong = $(el).find('strong');
        if (strong.length > 0) {
            const key = strong.text().replace(':', '').trim();
            let value = '';
            strong.nextAll().each((j, node) => {
                if (node.type === 'text') {
                    value += $(node).text();
                }
            });
            details.info[key] = value.trim() || 'N/A';
        }
    });

    details.info.genre = [];
    $('ul.list-inline a').each((i, el) => {
        const name = $(el).text().trim();
        const link = $(el).attr('href');
        const slug = link ? url.parse(link).pathname.split('/').pop() : null;

        if (name && link && slug && slug !== 'genres') {
             details.info.genre.push({
                name: name,
                link: rewriteUrl(link),
                slug: slug
            });
        }
    });

    let synopsis = $('div.my-4 p.text-justify').text().trim();
    if (!synopsis) {
         synopsis = $('div.my-4 h4:contains("Sinopsis") + p').text().trim();
    }
    details.info.synopsis = synopsis || 'N/A';

    const episodesRaw = [];
    $('.table-responsive table tbody tr').each((i, tr) => {
        const titleNode = $(tr).find('td:nth-child(1)');
        const linkNode = $(tr).find('td.text-center a');

        const epTitle = titleNode.text().trim() || 'N/A';
        const epLink = linkNode.attr('href') || null;

        let epId = null;
        if (epLink) {
            const idMatch = epLink.match(/\/episode\/([^\/]+)/);
            if (idMatch && idMatch[1]) {
                epId = idMatch[1];
            }
        }

        if (epId && epTitle !== 'N/A') {
            episodesRaw.push({
                id: epId,
                title: epTitle,
                link: rewriteUrl(epLink),
            });
        }
    });
    details.episodes = episodesRaw.reverse();

    return details;
};

const scrapeEpisodePage = async (episodeId) => {
    const targetUrl = `https://${TARGET_DOMAIN}/episode/${episodeId}`;
    const html = await fetchHtml(targetUrl, `https://${TARGET_DOMAIN}/`);

    if (!html) {
        return null;
    }

    const $ = cheerio.load(html);
    const episodeData = {
        title: 'N/A',
        anime_title: 'N/A',
        iframe_src: null,
        stream_servers: [],
        download_links: {},
        prev_episode: null,
        next_episode: null,
    };

    let pageTitle = $('title').text().trim();
    if (pageTitle) {
         episodeData.title = pageTitle.replace(/ - .*$/, '').trim();
    } else {
        const h1Node = $('h1, h2, div.title h3').first();
        if (h1Node.length > 0) {
            episodeData.title = h1Node.text().trim();
        }
    }


    const animeTitleNode = $('nav[aria-label="breadcrumb"] li:nth-last-child(2) a, h1[itemprop="itemReviewed"], div.anime-info h2').first();
     if (animeTitleNode.length > 0) {
        episodeData.anime_title = animeTitleNode.text().trim();
    } else if (episodeData.title !== 'N/A') {
        episodeData.anime_title = episodeData.title.replace(/ Episode\s*\d+\s*$/i, '').trim();
    }


    let iframeSrc = $('iframe#streaming-iframe').attr('src');
    if (!iframeSrc) {
         iframeSrc = $('iframe#streaming-iframe').attr('data-src');
    }
    episodeData.iframe_src = iframeSrc || null;

    $('#streaming-source option').each((i, el) => {
        const value = $(el).attr('value');
        const text = $(el).text().trim();
        if (value && value !== 'default' && text !== 'Default Source') {
            episodeData.stream_servers.push({ id: value, name: text });
        }
    });
    if(episodeData.iframe_src) {
        episodeData.stream_servers.unshift({ id: episodeData.iframe_src, name: 'Default Server (Original)' });
    }


    $('.table-responsive table.table-bordered tbody tr').each((i, tr) => {
        const qualityNode = $(tr).find('td:nth-child(1) span.badge, td:nth-child(1)').first();
        const sizeNode = $(tr).find('td:nth-child(2)').first();
        const linkNodes = $(tr).find('td:nth-child(3) a');

        const quality = qualityNode.text().trim() || 'N/A';
        const size = sizeNode.text().trim() || 'N/A';
        const links = [];

        linkNodes.each((j, a) => {
            const linkHref = $(a).attr('href');
            const linkText = $(a).text().trim();
             const iconNode = $(a).find('i');
             let providerText = linkText;
             if(iconNode.length > 0){
                 providerText = linkText.replace(iconNode.text().trim(), '').trim();
             }


            if (linkHref && linkHref !== '#') {
                 links.push({ provider: providerText, url: linkHref });
            }
        });

        if (quality !== 'N/A' && links.length > 0) {
            episodeData.download_links[quality] = { size: size, links: links };
        }
    });

     if (Object.keys(episodeData.download_links).length === 0) {
        $('.download li, .download-links .item').each((i, el) => {
            const qualityNode = $(el).find('strong, .quality').first();
            const quality = qualityNode.text().replace(':', '').trim() || null;

            if (!quality) return;

            const links = [];
            $(el).find('a').each((j, a) => {
                const linkHref = $(a).attr('href');
                const linkText = $(a).text().trim();
                const iconNode = $(a).find('i');
                let providerText = linkText;
                if(iconNode.length > 0){
                    providerText = linkText.replace(iconNode.text().trim(), '').trim();
                }

                if (linkHref && linkHref !== '#') {
                    links.push({ provider: providerText, url: linkHref });
                }
            });

            if (links.length > 0) {
                 const sizeNode = $(el).find('.size').first();
                 const size = sizeNode.text().trim() || 'N/A';
                 episodeData.download_links[quality] = { size: size, links: links };
            }
        });
     }


    $('div.d-flex.justify-content-between a.btn, div.episode-nav a').each((i, navLink) => {
        const href = $(navLink).attr('href');
        const text = $(navLink).text().trim();
        const isDisabled = $(navLink).hasClass('disabled');

        const isPrev = $(navLink).hasClass('prev') || text.includes('Sebelumnya') || text.includes('Prev');
        const isNext = $(navLink).hasClass('next') || text.includes('Selanjutnya') || text.includes('Next');

        if (href && href !== '#' && !isDisabled) {
            const idMatch = href.match(/\/episode\/([^\/]+)/);
            if (idMatch && idMatch[1]) {
                const navId = idMatch[1];
                if (isPrev) {
                    episodeData.prev_episode = { id: navId, link: rewriteUrl(href) };
                } else if (isNext) {
                    episodeData.next_episode = { id: navId, link: rewriteUrl(href) };
                }
            }
        }
    });

    return episodeData;
};

const searchAnime = async (query) => {
    if (!query) return [];
    const targetUrl = `https://${TARGET_DOMAIN}/search-ajax?q=${encodeURIComponent(query)}&page=1&limit=20`;
    const jsonData = await fetchHtml(targetUrl, `https://${TARGET_DOMAIN}/`);

    if (!jsonData) {
        return [];
    }

    try {
        const data = JSON.parse(jsonData);
        if (data && Array.isArray(data.results)) {
            return data.results.map(result => {
                if (result.href) {
                    const animeId = result.animeId || (result.href.match(/\/anime\/([^\/]+)/)?.[1]) || null;
                    return {
                         ...result,
                         link: animeId ? rewriteUrl(`/anime/${animeId}`) : rewriteUrl(result.href)
                    };
                }
                return result;
            });
        } else {
            console.error("Search AJAX did not return expected JSON structure.");
            return [];
        }
    } catch (e) {
        console.error("Failed to parse Search AJAX JSON:", e.message);
        if (typeof jsonData === 'string' && jsonData.trim().startsWith('<')) {
            console.error("Search AJAX returned HTML instead of JSON. Target site structure might have changed.");
        }
        return [];
    }
};


const scrapeGenreList = async () => {
    const targetUrl = `https://${TARGET_DOMAIN}/genres`;
    const html = await fetchHtml(targetUrl, targetUrl);

    if (!html) {
        return [];
    }

    const $ = cheerio.load(html);
    const genreList = [];

    $('ul.list-group li a').each((i, el) => {
        const name = $(el).text().trim();
        const href = $(el).attr('href');
        const slug = href ? url.parse(href).pathname.split('/').pop() : null;

        if (name && slug && slug !== 'genres') {
             genreList.push({
                name: name,
                 slug: slug,
                link: rewriteUrl(href)
            });
        }
    });

    return genreList;
};

module.exports = async (req, res) => {
    // Add custom JSON helper functions to the response object
    res.successJson = (data) => {
        res.status(200).json(data);
    };

    res.errorJson = (message, status = 400) => {
        res.status(status).json({ error: message });
    };

    const action = req.query.action || 'home';
    const id = req.query.id;
    const query = req.query.q;
    const serverId = req.query.server_id;
    const page = parseInt(req.query.page, 10) || 1;

    res.setHeader('Content-Type', 'application/json');

    try {
        switch (action) {
            case 'home':
                const homeData = await scrapeHome(page);
                if (homeData) {
                    res.successJson(homeData);
                } else {
                    res.errorJson('Gagal memuat data halaman utama.', 500);
                }
                break;

            case 'anime':
                if (!id) {
                    res.errorJson('Parameter ID anime hilang.');
                    return;
                }
                const animeDetails = await scrapeAnimeDetails(id);
                if (animeDetails) {
                    res.successJson(animeDetails);
                } else {
                    res.errorJson('Gagal memuat detail anime atau tidak ditemukan.', 404);
                }
                break;

            case 'episode':
                if (!id) {
                    res.errorJson('Parameter ID episode hilang.');
                    return;
                }
                const episodeData = await scrapeEpisodePage(id);
                if (episodeData) {
                    res.successJson(episodeData);
                } else {
                    res.errorJson('Gagal memuat data episode atau tidak ditemukan.', 404);
                }
                break;

            case 'search':
                if (!query) {
                    res.errorJson('Parameter query (q) hilang.');
                    return;
                }
                const searchResults = await searchAnime(query);
                 // Search can return empty array on no results, which is a success
                res.successJson(searchResults);
                break;

            case 'genres':
                const genreList = await scrapeGenreList();
                if (genreList) {
                    res.successJson(genreList);
                } else {
                    res.errorJson('Gagal memuat daftar genre.', 500);
                }
                break;

            case 'genre':
                if (!id) {
                    res.errorJson('Parameter ID genre (slug) hilang.');
                    return;
                }
                const genreData = await scrapeAnimeByGenre(id, page);
                if (genreData) {
                    genreData.genre_slug = id;
                    res.successJson(genreData);
                } else {
                     res.errorJson(`Gagal memuat anime untuk genre "${id}" atau genre tidak ditemukan.`, 404);
                }
                break;

            case 'get_server_url':
                 if (!serverId) {
                    res.errorJson('Parameter server_id hilang.');
                    return;
                }
                const bypassUrl = BYPASS_API_BASE_URL + encodeURIComponent(serverId);
                try {
                    const bypassResponse = await axios.get(bypassUrl, { timeout: 20000 });
                     if (bypassResponse.data && bypassResponse.data.url) {
                         res.status(bypassResponse.status).json(bypassResponse.data); // Use status from bypass API
                     } else {
                         console.error("Bypass API returned unexpected format:", bypassResponse.data);
                         res.errorJson('Endpoint bypass mengembalikan format tidak valid.', 502);
                     }
                } catch (proxyError) {
                     console.error("Error calling bypass API:", proxyError.message);
                     const statusCode = proxyError.response ? proxyError.response.status : 500;
                     const errorMessage = proxyError.response && proxyError.response.data ?
                                          (proxyError.response.data.error || JSON.stringify(proxyError.response.data)) :
                                          proxyError.message;
                     res.errorJson('Gagal menghubungi endpoint bypass.', statusCode >= 500 ? statusCode : 502, errorMessage);
                }
                break;

            case 'history':
                res.successJson([]);
                break;

            default:
                const defaultHomeData = await scrapeHome(page);
                 if (defaultHomeData) {
                     res.successJson(defaultHomeData);
                 } else {
                     res.errorJson('Gagal memuat data halaman utama default.', 500);
                 }
                break;
        }
    } catch (error) {
        console.error("Unhandled error in API handler:", error);
        res.errorJson('Terjadi kesalahan internal server.', 500);
    }
};

