const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://komiku.id';
const API_URL_BASE = 'https://api.komiku.id';
const PROXY_BASE_URL = 'https://nirkyy.koyeb.app/api/v1/komik';

async function fetchUrl(url) {
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://komiku.id/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Upgrade-Insecure-Requests': '1'
        },
        timeout: 45000,
        maxRedirects: 5,
        validateStatus: function (status) {
            return status >= 200 && status < 300;
        }
    };
    try {
        const response = await axios.get(url, options);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        return null;
    }
}

function formatTimeAgo(timestamp) {
    const timeAgo = (Date.now() - timestamp) / 1000;
    const seconds = timeAgo;
    const minutes = Math.round(timeAgo / 60);
    const hours = Math.round(timeAgo / 3600);
    const days = Math.round(timeAgo / 86400);
    const weeks = Math.round(timeAgo / 604800);
    const months = Math.round(timeAgo / 2600640);
    const years = Math.round(timeAgo / 31207680);

    if (seconds <= 60) return "Baru saja";
    else if (minutes <= 60) return minutes === 1 ? "1 menit lalu" : `${minutes} menit lalu`;
    else if (hours <= 24) return hours === 1 ? "1 jam lalu" : `${hours} jam lalu`;
    else if (days <= 7) return days === 1 ? "Kemarin" : `${days} hari lalu`;
    else if (weeks <= 4.3) return weeks === 1 ? "1 minggu lalu" : `${weeks} minggu lalu`;
    else if (months <= 12) return months === 1 ? "1 bulan lalu" : `${months} bulan lalu`;
    else return years === 1 ? "1 tahun lalu" : `${years} tahun lalu`;
}

function extractMangaSlug(url) {
    try {
        const parsedUrl = new URL(url, BASE_URL);
        const path = parsedUrl.pathname;
        if (path && path.startsWith('/manga/')) {
            const slug = path.replace('/manga/', '').replace(/\/$/, '');
            return (slug && !slug.includes('/')) ? slug : null;
        }
    } catch (e) {
    }
    return null;
}

function rewriteUrl(type, slug) {
    if (!slug) return null;
    if (type === 'manga') {
        return `${PROXY_BASE_URL}?manga=${slug}`;
    } else if (type === 'chapter') {
        return `${PROXY_BASE_URL}?chapter=${slug}`;
    }
    return null;
}

function extractChapterSlugFromUrl(url) {
     try {
        const parsedUrl = new URL(url, BASE_URL);
        const path = parsedUrl.pathname;
         if (path && path.startsWith('/ch/')) {
            let slug = path.substring(1).replace(/\/$/, '');
            if (slug && !slug.includes(' ') && slug.includes('-chapter-')) {
                 return slug;
            }
         } else if (path && !path.includes('/manga/') && path.length > 1 && path !== '/') {
             let slug = path.substring(1).replace(/\/$/, '');
             if (slug && !slug.includes(' ') && slug.includes('-')) {
                 return slug;
             }
         }
    } catch (e) {
    }
    return null;
}


module.exports = async (req, res) => {
    const { manga: mangaSlug, chapter: chapterSlug, s: searchQuery, tab: currentTab = 'home' } = req.query;
    const resultData = { query: req.query, data: null, error: null, source: 'komiku.id' };

    try {
        if (searchQuery) {
            const apiUrl = `${API_URL_BASE}/?post_type=manga&s=${encodeURIComponent(searchQuery)}`;
            const apiHtmlResult = await fetchUrl(apiUrl);
            resultData.source_url = apiUrl;

            if (apiHtmlResult) {
                const $ = cheerio.load(apiHtmlResult);
                const searchResults = [];
                $('div.bge').each((i, el) => {
                    const item = $(el);
                    const linkNode = item.find('a[href*="/manga/"]').first();
                    const imgNode = item.find('.bgei img').first();
                    const titleNode = item.find('.kan h3').first();
                    const altTitleNode = item.find('.kan span.judul2').first();
                    const typeNode = item.find('.tpe1_inf b').first();
                    const typeTextNode = item.find('.tpe1_inf').first().contents().filter(function() {
                        return this.type === 'text' && this.nodeValue.trim();
                      }).text().trim();
                    const descNode = item.find('.kan p').first();
                    const latestChapterNode = item.find('.new1').last().find('a span').last();

                    const detailLink = linkNode.attr('href');
                    const slug = extractMangaSlug(detailLink);

                    if (slug && titleNode.length && imgNode.length) {
                        searchResults.push({
                            slug: slug,
                            title: titleNode.text().trim(),
                            alt_title: altTitleNode.length ? altTitleNode.text().trim() : null,
                            url: rewriteUrl('manga', slug),
                            image_url: imgNode.attr('src'),
                            type: typeNode.length ? typeNode.text().trim() : null,
                            genre_in_type: typeTextNode || null,
                            description: descNode.length ? descNode.text().trim() : 'Deskripsi tidak tersedia.',
                            latest_chapter: latestChapterNode.length ? latestChapterNode.text().trim() : null,
                        });
                    }
                });
                 resultData.data = {
                    search_query: searchQuery,
                    results: searchResults,
                    count: searchResults.length
                 };
            } else {
                resultData.error = 'Failed to fetch search results from API Komiku or empty response.';
            }
        }
        else if (currentTab === 'popular') {
             const apiUrl = `${API_URL_BASE}/other/hot/?orderby=meta_value_num&category_name=`;
             const apiHtmlResult = await fetchUrl(apiUrl);
             resultData.source_url = apiUrl;

             if (apiHtmlResult) {
                 const $ = cheerio.load(apiHtmlResult);
                 const popularResults = [];
                 $('div.bge').each((i, el) => {
                     const item = $(el);
                     const linkNode = item.find('a[href*="/manga/"]').first();
                     const imgNode = item.find('.bgei img').first();
                     const titleNode = item.find('.kan h3').first();
                     const viewsTimeNode = item.find('.kan span.judul2').first();
                     const typeNode = item.find('.tpe1_inf b').first();
                     const typeTextNode = item.find('.tpe1_inf').first().contents().filter(function() {
                         return this.type === 'text' && this.nodeValue.trim();
                       }).text().trim();
                     const descNode = item.find('.kan p').first();
                     const latestChapterNode = item.find('.new1').last().find('a span').last();
                     const rankNode = item.find('.bgei span.hot').first();

                     const detailLink = linkNode.attr('href');
                     const slug = extractMangaSlug(detailLink);

                     if (slug && titleNode.length && imgNode.length) {
                        let rankStatus = 'stay';
                        let rankChange = null;
                        const rankText = rankNode.length ? rankNode.text().trim() : '';
                        const upMatch = /up (\d+)/i.exec(rankText);
                        const downMatch = /down (\d+)/i.exec(rankText);
                        if (upMatch) {
                            rankStatus = 'up';
                            rankChange = parseInt(upMatch[1], 10);
                        } else if (downMatch) {
                            rankStatus = 'down';
                            rankChange = parseInt(downMatch[1], 10);
                        }

                         popularResults.push({
                             slug: slug,
                             title: titleNode.text().trim(),
                             url: rewriteUrl('manga', slug),
                             image_url: imgNode.attr('src'),
                             views_time_info: viewsTimeNode.length ? viewsTimeNode.text().trim() : null,
                             rank_status: rankStatus,
                             rank_change: rankChange,
                             rank_text: rankText || null,
                             type: typeNode.length ? typeNode.text().trim() : null,
                             genre_in_type: typeTextNode || null,
                             description: descNode.length ? descNode.text().trim() : 'Deskripsi tidak tersedia.',
                             latest_chapter: latestChapterNode.length ? latestChapterNode.text().trim() : null,
                         });
                     }
                 });
                 resultData.data = {
                     title: "Komik Terpopuler Saat Ini",
                     results: popularResults,
                     count: popularResults.length
                 };
             } else {
                 resultData.error = 'Failed to fetch popular manga from API Komiku or empty response.';
             }
        }
        else if (currentTab === 'history') {
             resultData.title = "Riwayat Baca";
             const historyData = [];
             const historyJson = req.cookies?.readingHistory;
             let history = [];
             if (historyJson) {
                 try {
                     history = JSON.parse(historyJson);
                 } catch (e) {
                     console.warn("Could not parse reading history cookie:", e);
                     history = [];
                 }
             }

             if (Array.isArray(history) && history.length > 0) {
                 history.forEach(item => {
                     if (item.mangaSlug && item.chapterSlug && item.mangaTitle && item.chapterTitle) {
                         historyData.push({
                             manga_slug: item.mangaSlug,
                             chapter_slug: item.chapterSlug,
                             manga_title: item.mangaTitle,
                             chapter_title: item.chapterTitle,
                             manga_url: rewriteUrl('manga', item.mangaSlug),
                             chapter_url: rewriteUrl('chapter', item.chapterSlug),
                             read_at_timestamp: item.timestamp || null,
                             read_at_relative: item.timestamp ? formatTimeAgo(item.timestamp) : null,
                         });
                     }
                 });
             }
             resultData.data = {
                title: "Riwayat Baca",
                results: historyData,
                count: historyData.length
             };

        }
        else if (chapterSlug) {
            const chapterUrl = `${BASE_URL}/${chapterSlug}/`;
const html = await fetchUrl(chapterUrl);
resultData.source_url = chapterUrl;

if (html) {
  const $ = cheerio.load(html);
  const chapterTitle = $('#Judul h1').first().text().trim() || 'Chapter';
  let currentMangaTitle = 'Komik';
  let mangaDetailSlug = null;

  const breadcrumbMangaLink = $('#Judul p:first-child a[href*="/manga/"]').first();
  if (breadcrumbMangaLink.length) {
    currentMangaTitle = breadcrumbMangaLink.text().trim();
    mangaDetailSlug = extractMangaSlug(breadcrumbMangaLink.attr('href'));
  }

  const infoTableRows = [];
  $('#Judul table.tbl tbody tr').each((i, tr) => {
    const key = $(tr).find('td').eq(0).text().trim();
    const value = $(tr).find('td').eq(1).text().trim();
    if (key && value && key.toLowerCase() !== 'judul') {
      infoTableRows.push({
        key,
        value
      });
    }
    if (!mangaDetailSlug && key.toLowerCase() === 'judul komik') {
      currentMangaTitle = value;
    }
  });

  const images = [];
  $('#Baca_Komik img.ww').each((i, img) => {
    images.push($(img).attr('src'));
  });

  let prevChapterSlug = null;
  let nextChapterSlug = null;

  const navLinks = $('.botmenu .nxpr a.rl');
  if (navLinks.length > 0) {
    const prevLink = navLinks.eq(0);
    if (prevLink.length) {
      prevChapterSlug = extractChapterSlugFromUrl(prevLink.attr('href'));
    }
    const nextLink = navLinks.eq(1);
    if (nextLink.length) {
      nextChapterSlug = extractChapterSlugFromUrl(nextLink.attr('href'));
    }
  }

  resultData.data = {
    manga_slug: mangaDetailSlug,
    manga_title: currentMangaTitle,
    manga_url: rewriteUrl('manga', mangaDetailSlug),
    chapter_slug: chapterSlug,
    chapter_title: chapterTitle,
    chapter_url: rewriteUrl('chapter', chapterSlug),
    info: infoTableRows,
    images: images,
    prev_chapter_slug: prevChapterSlug,
    next_chapter_slug: nextChapterSlug,
    prev_chapter_url: rewriteUrl('chapter', prevChapterSlug),
    next_chapter_url: rewriteUrl('chapter', nextChapterSlug)
  };

} else {
  resultData.error = `Failed to fetch chapter data for slug: ${chapterSlug}`;
}
        }
        else if (mangaSlug) {
            const mangaUrl = `${BASE_URL}/manga/${mangaSlug}/`;
            const html = await fetchUrl(mangaUrl);
            resultData.source_url = mangaUrl;

            if (html) {
                const $ = cheerio.load(html);
                let mangaTitle = $('h1.jdl').first().text().trim();
                const infoTable = {};
                const coverImgSrc = $('.ims img').first().attr('src');
                const genres = [];
                const synopsis = $('p.desc').first().html()?.trim() || '<p>Sinopsis tidak tersedia.</p>';
                const chapters = [];

                 $('table.inftable tbody tr').each((i, tr) => {
                     const key = $(tr).find('td').eq(0).find('b').text().trim();
                     let valueCell = $(tr).find('td').eq(1);
                     let value = valueCell.find('span.badge').length
                        ? valueCell.find('span.badge').text().trim()
                        : valueCell.text().trim();

                     if (key && value) {
                        const keyLower = key.toLowerCase().replace(/\s+/g, '_');
                         infoTable[keyLower] = value;
                         if (keyLower === 'judul_komik' && !mangaTitle) {
                             mangaTitle = value;
                         }
                     }
                 });
                 if (!mangaTitle) mangaTitle = "Detail Komik";

                $('ul.genre li a').each((i, a) => {
                    genres.push($(a).text().trim());
                });

                $('#Daftar_Chapter #daftarChapter tr').slice(1).each((i, tr) => {
                     const linkNode = $(tr).find('td.judulseries a').first();
                     const dateNode = $(tr).find('td.tanggalseries').first();
                     const chapterLink = linkNode.attr('href');
                     const chapSlug = extractChapterSlugFromUrl(chapterLink);

                     if (chapSlug && dateNode.length) {
                         chapters.push({
                             slug: chapSlug,
                             title: linkNode.text().trim(),
                             url: rewriteUrl('chapter', chapSlug),
                             release_date: dateNode.text().trim(),
                         });
                     }
                 });

                resultData.data = {
                    slug: mangaSlug,
                    title: mangaTitle,
                    url: rewriteUrl('manga', mangaSlug),
                    cover_image_url: coverImgSrc,
                    info: infoTable,
                    genres: genres,
                    synopsis: synopsis,
                    chapters: chapters,
                    chapter_count: chapters.length
                };
            } else {
                resultData.error = `Failed to fetch manga details for slug: ${mangaSlug}`;
            }
        }
        else {
            const homeUrl = BASE_URL + '/';
            const html = await fetchUrl(homeUrl);
            resultData.source_url = homeUrl;

            if (html) {
                const $ = cheerio.load(html);
                const sections = {
                    trending: { title: 'Trending Minggu Ini 🔥', selector: "#Trending_Komik article.ls2", type: 'ls2', items: [] },
                    rekomendasi: { title: 'Rekomendasi Komiku ✨', selector: "#Rekomendasi_Komik article.ls2", type: 'ls2', items: [] },
                    manga_populer: { title: 'Manga Populer', selector: "#Komik_Hot_Manga article.ls2", type: 'ls2', items: [] },
                    manhwa_populer: { title: 'Manhwa Populer', selector: "#Komik_Hot_Manhwa article.ls2", type: 'ls2', items: [] },
                    manhua_populer: { title: 'Manhua Populer', selector: "#Komik_Hot_Manhua article.ls2", type: 'ls2', items: [] },
                    terbaru: { title: 'Update Terbaru 🚀', selector: "#Terbaru div.ls4w article.ls4", type: 'ls4', items: [] },
                };

                for (const key in sections) {
                    const section = sections[key];
                    $(section.selector).each((i, el) => {
                        const article = $(el);
                        let linkNode, imgNode, titleNode, infoNode, chapterNode, slug;

                        if (section.type === 'ls2') {
                            linkNode = article.find('.ls2v a').first();
                            imgNode = article.find('.ls2v a img').first();
                            titleNode = article.find('.ls2j h3 a').first();
                            infoNode = article.find('.ls2j span.ls2t').first();
                            chapterNode = article.find('.ls2j a.ls2l').first();
                        } else {
                            linkNode = article.find('.ls4v a').first();
                            imgNode = article.find('.ls4v a img').first();
                            titleNode = article.find('.ls4j h3 a').first();
                            infoNode = article.find('.ls4j span.ls4s').first();
                            chapterNode = article.find('.ls4j a.ls24').first();
                        }

                        const mangaLink = linkNode.attr('href');
                        slug = extractMangaSlug(mangaLink);

                        if (slug && imgNode.length && titleNode.length) {
                            const imgSrc = imgNode.attr('data-src') || imgNode.attr('src');
                            const title = titleNode.text().trim();
                            const info = infoNode.length ? infoNode.text().trim() : '';
                            const lastChapter = chapterNode.length ? chapterNode.text().trim() : '';

                            let genre = '';
                            let detailInfo = '';

                            const infoParts = info.split('•').map(s => s.trim());
                             genre = infoParts[0] || '';

                            if (section.type === 'ls4') {
                                const timeAgoMatch = /(\d+ (menit|jam|hari|minggu|bulan|tahun) lalu|Baru saja|Kemarin)/i;
                                const match = info.match(timeAgoMatch);
                                if (match) {
                                    detailInfo = match[0];
                                    genre = info.replace(detailInfo, '').trim();
                                } else {
                                    genre = info;
                                }
                            } else {
                                detailInfo = infoParts[1] || '';
                            }

                             section.items.push({
                                 slug: slug,
                                 title: title,
                                 url: rewriteUrl('manga', slug),
                                 image_url: imgSrc,
                                 genre: genre || null,
                                 detail_info: detailInfo || null,
                                 latest_chapter: lastChapter || null,
                                 type: section.type
                             });
                        }
                    });
                }
                 resultData.data = sections;

            } else {
                resultData.error = 'Failed to fetch home page data from Komiku.';
            }
        }

        if (resultData.error) {
            res.status(500).json(resultData);
        } else if (!resultData.data && !searchQuery && !mangaSlug && !chapterSlug && currentTab === 'home') {
             resultData.error = 'Homepage data seems empty after processing.';
             res.status(500).json(resultData);
        } else if (!resultData.data && (searchQuery || mangaSlug || chapterSlug || currentTab !== 'home')) {
             resultData.error = 'No data found for the requested resource.';
             res.status(404).json(resultData);
        }
         else {
            res.status(200).json(resultData);
        }

    } catch (error) {
        console.error("Unhandled error in handler:", error);
        resultData.error = `An unexpected server error occurred: ${error.message}`;
        res.status(500).json(resultData);
    }
};