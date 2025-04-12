const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { handleTextQuery } = require('../lib/ai.js');
const { pin } = require('../lib/pinterest.js');
const { jadwal } = require('../lib/animeJadwal.js');
const crypto = require('crypto');
const alicia = require('../lib/alicia.js');
const gq = require('../lib/genrateQuery.js');
const snapsave = require('../lib/snapsave.js')
const speechma = require('../lib/speechma.js')
const imagine = require('../lib/imagine.js')
const gemini = require('../lib/toolbaz.js')
const luminai = require('../lib/luminai.js')
const rmbg = require('../lib/removebg.js')
const nulis = require('../lib/nulis.js')
const upscale = require('../lib/upscale.js')
const chatgpt = require('../lib/chatgpt.js')
const translate = require('../lib/translate.js');
const yanzGPT = require('../lib/yanzGPT.js')
const spotify = require('../lib/spotify.js')
const tiktokScrapt = require('../lib/tiktok.js')
const ghiblistyle = require('../lib/ghiblistyle.js')
const fancyText = require('../lib/fancyText.js')
const ngl = require('../lib/ngl.js')
const youtubeSearch = require('../lib/youtubeSearch.js')
const playyt = require('../lib/play.js')
const ttsindo = require('../lib/ttsindo.js')
const allvid = require('../lib/alvid.js')
const googleSearch = require('../lib/googleSearch.js')
//-
router.get('/yahoo-search', googleSearch)
router.get('/allvid', allvid);
router.get('/text2speech-indo', ttsindo)
router.get('/ytplay-mp3', playyt)
router.get('/youtube-search', youtubeSearch)
router.get('/sendngl', ngl)
router.get('/fancytext', fancyText)
router.get('/ghiblistyle', ghiblistyle)
router.get('/tiktokdl', tiktokScrapt)
router.get('/spotifydl', spotify);
router.get('/yanzgpt', yanzGPT);
router.get('/gemini-translate', translate)
router.get('/gpt-4o-latest', chatgpt)
router.get('/upscale', upscale)
router.get('/nulis', nulis)
router.get('/removebg', rmbg)
router.get('/luminai', luminai)
router.get('/gemini',gemini)

router.get('/elevenlabs', async (req, res) => {
  const baseUrls = [
    'https://elevenlabs-crack.vercel.app',
    'https://elevenlabs-crack-qyb7.vercel.app',
    'https://elevenlabs-crack-f2zu.vercel.app'
  ]

  const text = req.query.text
  let model = req.query.model
  if (!text) return res.errorJson('Missing text parameter')

  for (let i = 0; i < 3; i++) {
    const baseUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)]
    try {
      if (!model || model === "getList") {
  const { data: html } = await axios.get(baseUrl + '/');
  const $ = cheerio.load(html);
  const options = $('#model option').map((_, el) => $(el).val()).get();
  return res.succesJson({ models: options });
}

      const payload = new URLSearchParams()
      payload.append('model', model)
      payload.append('text', text)

      const { data, headers } = await axios.post(`${baseUrl}/generate-audio`, payload.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
          'Referer': baseUrl + '/'
        },
        responseType: 'arraybuffer'
      })

      res.set({
        'Content-Type': headers['content-type'],
        'Content-Length': headers['content-length']
      })
      return res.send(data)
    } catch (e) {}
  }

  res.errorJson('Mungkin model Tidak tersedia Atau tunggu beberapa menit untuk mencoba lagi pantek', 500)
})
router.get('/jadibabi', async (req, res) => {
    const imageUrl = req.query.url;
    const filterName = 'piggy';
    const apiEndpoint = 'https://negro.consulting/api/process-image';
    const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36';
    const referer = 'https://negro.consulting/#tools';

    if (!imageUrl) {
        return res.errorJson('Parameter URL gambar diperlukan.', 400);
    }

    let imageResponse;
    try {
        imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        if (imageResponse.status !== 200) {
             throw new Error(`Gagal mengambil gambar dari URL. Status: ${imageResponse.status}`);
        }

    } catch (error) {
        const status = error.response ? error.response.status : 500;
        return res.errorJson(`Gagal mengambil gambar dari URL: ${error.message}`, status);
    }

    try {
        const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

        const payload = {
            imageData: base64Image,
            filter: filterName
        };

        const apiResponse = await axios.post(apiEndpoint, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': userAgent,
                'Referer': referer,
            },
            timeout: 30000
        });

        if (apiResponse.status >= 200 && apiResponse.status < 300) {
            const responseData = apiResponse.data;
            if (responseData && responseData.status === 'success' && responseData.processedImageUrl) {
                try {
                    let base64Data = responseData.processedImageUrl;
                    let contentType = 'image/jpeg';

                    if (base64Data.startsWith('data:')) {
                        const parts = base64Data.match(/^data:(image\/[a-z]+);base64,(.*)$/);
                        if (parts && parts.length === 3) {
                            contentType = parts[1];
                            base64Data = parts[2];
                        } else {
                             base64Data = base64Data.split(',')[1] || base64Data;
                        }
                    }

                    const imageBuffer = Buffer.from(base64Data, 'base64');

                    res.setHeader('Content-Type', contentType);
                    res.send(imageBuffer);

                } catch (decodeError) {
                    console.error("Error decoding Base64 data:", decodeError.message);
                    return res.errorJson('Gagal mendekode data gambar Base64 dari API.', 500);
                }
            } else {
                 const message = `API mengembalikan respon tidak sukses atau data tidak ditemukan. Status: ${responseData?.status ?? 'N/A'}`;
                 return res.errorJson(message, 502);
            }
        } else {
             return res.errorJson(`API mengembalikan HTTP status code: ${apiResponse.status}`, apiResponse.status);
        }

    } catch (error) {
         let status = 500;
         let message = `Terjadi error saat memproses gambar: ${error.message}`;

         if (axios.isAxiosError(error)) {
            if (error.response) {
                status = error.response.status;
                message = `Error dari API (${status}): ${JSON.stringify(error.response.data || error.message)}`;
            } else if (error.request) {
                status = 504;
                message = `Tidak ada respon dari API: ${error.message}`;
            }
         }
        return res.errorJson(message, status);
    }
});


router.get('/lirik', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.errorJson({ error: 'Parameter q (query) diperlukan.' }, 400);
    }

    const url = `https://www.lyrics.com/lyrics/${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
                'Referer': `https://www.lyrics.com/lyrics/${encodeURIComponent(query)}`,
            },
            decompress: true,
        });

        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const lyricDiv = $('.sec-lyric.clearfix').first();
        const lyricBody = lyricDiv.find('.lyric-body').text().trim();

        if (lyricBody) {
            res.succesJson({ lyrics: lyricBody });
        } else {
            res.errorJson({ error: 'Lirik tidak ditemukan.' }, 404);
        }
    } catch (error) {
        res.errorJson({ error: 'Terjadi kesalahan saat mengambil lirik.' });
    }
});

router.get('/youtube-audio', async (req, res) => {
  try {
    const { url: youtubeUrl } = req.query;

    if (!youtubeUrl) {
      return res.errorJson("Parameter 'url' diperlukan", 400);
    }

    if (!/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(youtubeUrl)) {
      return res.errorJson("Parameter 'url' harus berupa URL YouTube yang valid", 400);
    }

    const initialUrl = 'https://ytmp3.ing/';
    const audioUrl = 'https://ytmp3.ing/audio';
    const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36';

    const initialResponse = await axios.get(initialUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': initialUrl,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
      }
    });

    const $ = cheerio.load(initialResponse.data);
    const csrfToken = $('form.download-form input[name="csrfmiddlewaretoken"]').val();

    if (!csrfToken) {
      return res.errorJson("Tidak dapat menemukan csrfmiddlewaretoken", 500);
    }

    const cookies = initialResponse.headers['set-cookie'];
    let cookieString = '';
    if (cookies) {
      cookieString = cookies.map(cookie => cookie.split(';')[0]).join('; ');
    }

    const payload = new URLSearchParams();
    payload.append('url', youtubeUrl);

    const audioResponse = await axios.post(audioUrl, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': csrfToken,
        'User-Agent': userAgent,
        'Referer': initialUrl,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': '*/*',
        'Origin': 'https://ytmp3.ing',
        'Cookie': cookieString
      },
      responseType: 'json'
    });

    if (!audioResponse.data || !audioResponse.data.url || !audioResponse.data.filename) {
      return res.errorJson("Respons tidak valid dari API audio", 500);
    }

    const encodedUrl = audioResponse.data.url;
    const filename = audioResponse.data.filename;

    const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');

    res.succesJson({ decodedUrl, filename });

  } catch (error) {
    let errorMessage = error.message;
    let status = 500;
    if (error.response) {
      status = error.response.status;
      errorMessage = `Error ${error.response.status}: ${error.response.statusText || 'Gagal mengambil data'}`;
      if (error.response.data && typeof error.response.data === 'object') {
        errorMessage += ` - ${JSON.stringify(error.response.data)}`;
      } else if (error.response.data) {
        errorMessage += ` - ${error.response.data}`;
      }
    } else if (error.request) {
      errorMessage = "Tidak ada respons dari server";
    }
    res.errorJson(errorMessage, status);
  }
});

router.get('/anime-quotes', async (req, res) => {
  try {
    const axios = require('axios');
    const cheerio = require('cheerio');
    const url = 'https://www.gramedia.com/best-seller/kata-kata-bijak-anime/';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': url
    };

    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);

    const quotes = [];
    $('li[style="font-weight: 400;"][aria-level="1"]').each((index, element) => {
      quotes.push($(element).text().trim());
    });

    if (quotes.length === 0) {
      return res.errorJson('No matching quotes found.', 200);
    }

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    res.succesJson(randomQuote);

  } catch (error) {
    res.errorJson(error.message, 500);
  }
});

router.get('/bluefire', async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) {
            return res.errorJson('Parameter text diperlukan', 400);
        }

        const apiUrl = 'https://www.flamingtext.com/net-fu/image_output.cgi';
        const params = {
            _comBuyRedirect: 'false',
            script: 'blue-fire',
            text: text,
            symbol_tagname: 'popular',
            fontsize: '70',
            fontname: 'futura_poster',
            fontname_tagname: 'cool',
            textBorder: '15',
            growSize: '0',
            antialias: 'on',
            hinting: 'on',
            justify: '2',
            letterSpacing: '0',
            lineSpacing: '0',
            textSlant: '0',
            textVerticalSlant: '0',
            textAngle: '0',
            textOutline: 'false',
            textOutlineSize: '2',
            textColor: '#0000CC',
            angle: '0',
            blueFlame: 'false',
            frames: '5',
            pframes: '5',
            oframes: '4',
            distance: '2',
            transparent: 'false',
            extAnim: 'gif',
            animLoop: 'on',
            defaultFrameRate: '75',
            doScale: 'off',
            scaleWidth: '240',
            scaleHeight: '120',
            _: Date.now()
        };

        const headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
            'Referer': 'https://www.flamingtext.com/net-fu/dynamic.cgi?script=blue-fire'
        };

        const apiResponse = await axios.get(apiUrl, { params, headers });

        if (apiResponse.data && apiResponse.data.src) {
            const imageUrl = apiResponse.data.src;
            const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                 headers: {
                    'User-Agent': headers['User-Agent'],
                    'Referer': apiUrl
                 }
            });
            res.setHeader('Content-Type', 'image/gif');
            res.send(imageResponse.data);
        } else {
             res.errorJson(new Error('Gagal mendapatkan URL gambar dari API FlamingText'), 500);
        }

    } catch (error) {
         res.errorJson(error, 500);
    }
});

router.get('/fireLogo', async (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.errorJson('Parameter "text" is required', 400);
    }

    const params = {
      _comBuyRedirect: "false",
      script: "fire-logo",
      text: text,
      symbol_tagname: "popular",
      fontsize: "70",
      fontname: "Cry Uncial",
      fontname_tagname: "cool",
      textBorder: "20",
      growSize: "0",
      antialias: "on",
      hinting: "on",
      justify: "2",
      letterSpacing: "0",
      lineSpacing: "0",
      textSlant: "0",
      textVerticalSlant: "0",
      textAngle: "0",
      textOutline: "false",
      textOutlineSize: "2",
      textColor: "#000000",
      fireSize: "70",
      backgroundResizeToLayers: "on",
      backgroundRadio: "1",
      backgroundColor: "#000000",
      backgroundPattern: "Wood",
      backgroundPattern_tagname: "standard",
      backgroundGradient: "Web20 Blue 3D #10",
      backgroundGradient_tagname: "standard",
      backgroundGradientAngle: "180",
      backgroundGradientCenterX: "50",
      backgroundGradientCenterY: "50",
      backgroundStarburstColorAlt: "#ED2400",
      backgroundStarburstColor1: "#BD2409",
      backgroundStarburstNum: "25",
      backgroundStarburstRayPercentage: "50",
      backgroundStarburstUseColor2: "false",
      backgroundStarburstColor2: "#000000",
      backgroundStarburstOffsetAngle: "0",
      backgroundStarburstXOffset: "0",
      backgroundStarburstYOffset: "0",
      backgroundStarburstCenterPercentage: "2",
      backgroundStarburstRadiusX: "1000",
      backgroundStarburstRadiusY: "1000",
      backgroundStarburstCF1: "0",
      backgroundUseOverlay: "off",
      backgroundOverlayMode: "5",
      backgroundOverlayPattern: "Parque #1",
      backgroundOverlayPattern_tagname: "standard",
      backgroundOverlayOpacity: "100",
      backgroundImageUrl: "http://www.flamingtext.com/images/textures/texture3.jpg",
      useFixedSize: "false",
      imageWidth: "400",
      imageHeight: "150",
      imageAlignment: "4",
      autocrop: "false",
      autocropPadding: "0",
      watermark: "none",
      ext: "png",
      jpgQuality: "85",
      doScale: "off",
      scaleWidth: "240",
      scaleHeight: "120",
      _: Date.now()
    };

    const headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': 'https://www.flamingtext.com/logo/Design-Fire'
    };

    const response = await axios.get('https://www.flamingtext.com/net-fu/image_output.cgi', {
      params: params,
      headers: headers
    });

    const gambar = await axios.get(response.data.src, { responseType: "arraybuffer" });
    res.setHeader('Content-Type', 'image/png');
    res.send(gambar.data);
  } catch (error) {
    let errorMessage = error.message;
    let status = 500;
    if (error.response) {
      status = error.response.status;
      errorMessage = `API Error: ${error.response.status} ${error.response.statusText}`;
      if (typeof error.response.data === 'string' && error.response.data.length < 200) {
        errorMessage += ` - ${error.response.data}`;
      }
    } else if (error.request) {
      errorMessage = 'API Error: No response received from server.';
    }
    res.errorJson(errorMessage, status);
  }
});

router.get('/wikipedia-random', async (req, res) => {
    try {
        const url = 'https://id.m.wikipedia.org/wiki/Special:Random';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const judul = $('span.mw-page-title-main').text().trim() || "";
        const deskripsi = $('p')
            .first()
            .text()
            .trim()
            .replace(/\[\d+\]/g, '') || "";
        
        const gambar = $('span[typeof="mw:File"] img')
            .map((i, el) => `https:${$(el).attr('src')}`)
            .get();
        
        res.json({
            judul,
            deskripsi,
            gambar
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

router.get('/anime-popular', async (req, res) => {
  try {
    const response = await axios.get('https://myanimelist.net/topanime.php?type=bypopularity', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.40 Mobile Safari/537.36',
        'Referer': 'https://myanimelist.net/topanime.php?type=bypopularity'
      }
    });

    const $ = cheerio.load(response.data);
    const result = [];

    $('.information').each((_, el) => {
      const rank = $(el).find('.rank .text').text().trim();
      const title = $(el).find('.title').text().trim();
      const type = $(el).find('.misc .type').text().trim();
      const score = $(el).find('.score').text().trim();
      const members = $(el).find('.member').text().trim();
      const link = $(el).next('.thumb').attr('href') || '';

      const imgDiv = $(el).parent().next('.tile-unit');
      const image = imgDiv.data('bg') || '';

      if (rank && title) {
        result.push({ rank, title, type, score, members, link, image });
      }
    });

    res.succesJson(result);
  } catch (error) {
    res.errorJson({ error: error.message });
  }
});

router.get('/jadwaltv', async (req, res) => {
  const channel = req.query.channel ? req.query.channel.toLowerCase().trim() : '';
  if (!channel) {
    return res.status(400).json({ error: 'Channel parameter is required' });
  }

  const url = `https://www.jadwaltv.net/channel/${channel}`;
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const result = [];
    $('tr.jklIv').each((i, el) => {
      const time = $(el).find('td').first().text().trim();
      const program = $(el).find('td').last().text().trim();
      result.push({ time, program });
    });
    res.succesJson(result);
  } catch (err) {
    res.errorJson({ error: err.toString() });
  }
});

router.get('/tangga-lagu', async (req, res) => {
    try {
        const { data } = await axios.get('https://www.jadwaltv.net/tangga-lagu-youtube-tangga-lagu-indonesia-terbaru');
        const $ = cheerio.load(data);
        const songs = [];

        $('tr').each((_, el) => {
            const rank = $(el).find('td:nth-child(1)').text().trim();
            const img = $(el).find('td:nth-child(2) img').attr('data-src') || $(el).find('td:nth-child(2) img').attr('src');
            const title = $(el).find('td:nth-child(3) strong').text().trim();
            const artist = $(el).find('td:nth-child(3) span').text().trim();
            const youtube = $(el).find('td:nth-child(4) a').attr('href');
            const spotify = $(el).find('td:nth-child(5) a').attr('href');

            if (rank && title && img.startsWith('http')) {
                songs.push({ rank, img, title, artist, youtube, spotify });
            }
        });

        res.succesJson(songs);
    } catch (error) {
        res.errorJson({ error: 'Failed to fetch data' });
    }
});

router.get('/kecocokan', async (req, res) => {
  const { nama1, nama2 } = req.query;
  try {
    const response = await axios.get(`https://express-vercel-ytdl.vercel.app/kecocokan?nama1=${nama1}&nama2=${nama2}`, {
      responseType: 'arraybuffer'
    });
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.errorJson('Failed to fetch image');
  }
});

router.get('/anime-search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.errorJson('Masukkan judul anime yang ingin dicari', 400);
  }

  try {
    const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&sfw`);
    const result = response.data.data;

    if (result.length === 0) {
      return res.errorJson('Anime tidak ditemukan.', 404);
    }

    const anime = result[0];
    const originalSynopsis = anime.synopsis;
    const aiPrompt = `Terjemahkan dan ringkas sinopsis di bawah secara langsung tanpa basa basi:\n\n${originalSynopsis}`;

    const geminiResponse = await axios.get(`https://nirkyy.koyeb.app/api/v1/gemini?prompt=${encodeURIComponent(aiPrompt)}`);
    const summarizedSynopsis = geminiResponse.data.data;

    const genres = anime.genres.map(genre => genre.name).join(', ');
    const themes = anime.themes.map(theme => theme.name).join(', ');

    res.succesJson({
      thumbnail: anime.images.jpg.image_url,
      title: anime.title,
      genre: genres,
      theme: themes,
      rating: anime.score,
      sinopsis: summarizedSynopsis.trim(),
      template: `*Title:* ${anime.title}\n*Genre:* ${genres}\n*Theme:* ${themes}\n*Rating:* ${anime.score}\n\n*Sinopsis:* ${summarizedSynopsis.trim()}`
    });
  } catch (error) {
    console.error('Error searching for anime:', error);
    res.errorJson('Terjadi kesalahan saat mencari anime.');
  }
});

router.get('/soundoftext', async (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).send('Parameter "text" is required.');
  }

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.soundoftext.com/sounds',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://soundoftext.com',
        'Referer': 'https://soundoftext.com/',
        'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"Android"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
      },
      data: {
        engine: 'Google',
        data: {
          text: text,
          voice: 'id-ID',
        },
      },
    });
    response.data.id = "https://files.soundoftext.com/"+response.data.id+".mp3"
    res.succesJson(response.data.id);
  } catch (error) {
    console.error('Error calling Sound of Text API:', error);
    if (error.response) {
      res.errorJson(error.response.data);
    } else {
      res.errorJson('Internal Server Error');
    }
  }
});

router.get('/deepseek', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    const response = await axios.post(
      'https://www.multichatai.com/api/chat/deepinfra',
      {
        chatSettings: {
          model: 'deepseek-ai/DeepSeek-R1',
          prompt: 'You are a friendly, helpful AI assistant.',
          temperature: 0.5,
          contextLength: 32000,
          includeProfileContext: true,
          includeWorkspaceInstructions: true,
          embeddingsProvider: 'openai',
        },
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        customModelId: '',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'accept-language': 'en-US,en;q=0.9,en-GB;q=0.8,en-IN;q=0.7',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'referrer': 'https://www.multichatai.com/1ed886c3-9f08-4090-9e44-123456/chat?model=claude-3-5-sonnet',
          'referrerPolicy': 'strict-origin-when-cross-origin',
        },
      }
    );

    res.succesJson(response.data);
  } catch (error) {
    console.error('Error calling Deepinfra API:', error);
    res.errorJson({ error: 'Failed to process the request' });
  }
});

router.get('/speechma', speechma);
router.get('/brats', async (req, res) => {
  const host = req.query.host;
  const text = req.query.text;

  if (!host || !text) {
    return res.errorJson({ error: "Parameter 'host' dan 'text' harus disediakan." },400);
  }

  try {
    const apiUrl = `https://express-vercel-ytdl.vercel.app/brats?host=${encodeURIComponent(host)}&text=${encodeURIComponent(text)}`;
    const response = await axios.get(apiUrl, { responseType: 'stream' });
    res.setHeader('Content-Type', 'image/png');
    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching or streaming brats image:", error);
    res.errorJson({ error: "Gagal mengambil atau mengirim gambar brats." });
  }
});

router.get('/artinama', async (req, res) => {
  const nama = req.query.nama;

  if (!nama) {
    return res.errorJson({ error: "Parameter 'nama' harus disediakan." },400);
  }

  try {
    const apiUrl = `https://express-vercel-ytdl.vercel.app/arti?nama=${encodeURIComponent(nama)}`;
    const response = await axios.get(apiUrl, { responseType: 'stream' });

    res.setHeader('Content-Type', 'image/jpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching or streaming khodam image:", error);
    res.errorJson({ error: "Gagal mengambil atau mengirim gambar khodam." });
  }
});

router.get('/khodam', async (req, res) => {
  const nama = req.query.nama;

  if (!nama) {
    return res.errorJson({ error: "Parameter 'nama' harus disediakan." },400);
  }

  try {
    const apiUrl = `https://express-vercel-ytdl.vercel.app/khodam?nama=${encodeURIComponent(nama)}`;
    const response = await axios.get(apiUrl, { responseType: 'stream' });

    res.setHeader('Content-Type', 'image/jpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching or streaming khodam image:", error);
    res.errorJson({ error: "Gagal mengambil atau mengirim gambar khodam." });
  }
});

router.get('/snapsave', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.errorJson({ error: "Parameter 'url' harus disediakan." },400);
  }
  try {
    await snapsave(req, res);
  } catch (error) {
    console.error("Error processing snapsave request:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan snapsave." });
  }
});


router.get('/imagine', imagine)

router.get('/simsimi', async (req, res) => {
  const msg = req.query.msg;
  const id = req.query.lang || "id";

  if (!msg) {
    return res.errorJson({ error: "Parameter 'msg' harus disediakan." },400);
  }

  try {
    const response = await axios.post('https://simsimi.vn/web/simtalk', `text=${encodeURIComponent(msg)}&lc=${id}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    res.succesJson({ respon: response.data.success });
  } catch (error) {
    console.error("Error calling SimSimi API:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan SimSimi." });
  }
});

router.get('/generate-query', async (req, res) => {
  const user = req.query.user;
  const msg = req.query.msg;

  if (!user || !msg) {
    return res.errorJson({ error: "Parameter 'user' dan 'msg' harus disediakan." },400);
  }

  try {
    let response = await gq.botika(user, msg);
    response = response.replace(/Alicia:/i, "").trim();
    res.succesJson(JSON.parse(response));
  } catch (error) {
    console.error("Error calling alicia.botika:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan." });
  }
});

router.get('/alicia', async (req, res) => {
  const user = req.query.user;
  const msg = req.query.msg;

  if (!user || !msg) {
    return res.errorJson({ error: "Parameter 'user' dan 'msg' harus disediakan." },400);
  }

  try {
    let response = await alicia.botika(user, msg);
    response = response.replace(/Alicia:/i, "").trim();
    res.succesJson({ response });
  } catch (error) {
    console.error("Error calling alicia.botika:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan." });
  }
});

router.get('/memegen', async (req, res) => {
  const { text_atas, text_bawah, background } = req.query;
  let url = 'https://api.memegen.link/images/custom';
  if (text_atas || text_bawah) {
    const atas = text_atas ? encodeURIComponent(text_atas) : ' ';
    const bawah = text_bawah ? encodeURIComponent(text_bawah) : ' ';
    url += `/${atas}/${bawah}.png`;
  } else {
    return res.errorJson({ error: 'Parameter text-atas atau text-bawah harus diisi.' },400);
  }
  if (background) {
    url += `?background=${encodeURIComponent(background)}`;
  }
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error('Error saat memanggil API memegen:', error);
    res.errorJson({ error: 'Terjadi kesalahan saat memproses permintaan.' });
  }
});

router.get('/autogempa', async (req, res) => {
  try {
    const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
    const data = response.data;
    if (data && data.Infogempa && data.Infogempa.gempa) {
      data.Infogempa.gempa.Shakemap = "https://data.bmkg.go.id/DataMKG/TEWS/" + data.Infogempa.gempa.Shakemap;
      res.succesJson(data.Infogempa.gempa);
    } else {
      res.errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' },404);
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data autogempa:', error);
    if (error.response) {
      res.errorJson({ message: `Kesalahan server: ${error.response.statusText}` });
    } else if (error.request) {
      res.errorJson({ message: 'Tidak dapat terhubung ke server BMKG.' });
    } else {
      res.errorJson({ message: 'Terjadi kesalahan saat mengambil data autogempa.' });
    }
  }
});

router.get('/susunkata', async (req, res) => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/susunkata.json');
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomItem = data[randomIndex];
      res.succesJson(randomItem);
    } else {
      res.errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' },404);
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data:', error);
    res.errorJson({ message: 'Terjadi kesalahan saat mengambil data.' });
  }
});

router.get('/asahotak', async (req, res) => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/asahotak.json');
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomItem = data[randomIndex];
      res.succesJson(randomItem);
    } else {
      res.errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' },404);
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data:', error);
    res.errorJson({ message: 'Terjadi kesalahan saat mengambil data.' });
  }
});

router.get('/savetube', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.errorJson("Masukkan parameter url",400);
  if (!format) return res.errorJson("Masukkan parameter format",400);
  try {
    let response;
    try {
      response = await axios.get(`https://pursky.vercel.app/api/ytdl?url=${url}?si=HJ1GvDr8o1dNUKcB&format=${format}`);
    } catch (firstError) {
      try {
        response = await axios.get(`https://pursky.vercel.app/api/ytdl?url=${url}?si=HJ1GvDr8o1dNUKcB&format=${format}`);
      } catch (secondError) {
        return res.errorJson(secondError);
      }
    }
    if (response.status !== 200) return res.errorJson("Terjadi kesalahan saat mengunduh video");
    return res.succesJson(response.data);
  } catch (error) {
    return res.errorJson(error);
  }
});

router.get('/anime-jadwal', async (req, res) => {
  const hari = req.query.hari;
  if (!hari) {
    return res.errorJson("Hari tidak valid. Masukkan nama hari dalam bahasa Inggris atau Indonesia",400)
  }
  try {
    const response = await jadwal(hari.trim());
    if (response.includes("Hari tidak valid.")) {
      return res.errorJson(response,400)
    }
    return res.succesJson(response);
  } catch (error) {
    return res.errorJson({ error: error.message });
  }
});

router.get('/pin', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.errorJson("Search query cannot be empty.",400);
  try {
    const result = await pin.search(query);
    if (result.status) {
      return res.succesJson(result.result);
    } else {
      return res.errorJson(result.result);
    }
  } catch (error) {
    return res.errorJson(error.message);
  }
});

router.get('/llm', async (req, res) => {
  let { groqKey, model = 'gemma2-9b-it', systemPrompt = " ", msg, user } = req.query;
  if (!groqKey) return res.errorJson("groqKey is required",400);
  if (!msg) return res.errorJson("msg is required",400);
  if (!user) return res.errorJson("user is required",400);
  if (groqKey.includes('Bearer')) groqKey = groqKey.replace('Bearer ', '').trim();
  try {
    const response = await handleTextQuery({ groqKey, model, systemPrompt, msg, user });
    if (response.reply.includes('API Error')) return res.errorJson(response.reply);
    return res.succesJson(response);
  } catch (error) {
    return res.errorJson(error);
  }
});


module.exports = router;