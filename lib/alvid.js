const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');

module.exports = async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl || !/^https?:\/\//.test(videoUrl)) {
    return res.errorJson('URL video tidak valid.', 400);
  }

  const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36';
  const REFERER = `https://aiovd.com/#url=${encodeURIComponent(videoUrl)}/`;

  const fetchData = async (url, options = {}) => {
    try {
      const axiosOptions = {
        url,
        method: options.post ? 'POST' : 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': options.referer || 'https://aiovd.com/',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Encoding': 'gzip, deflate'
        },
        timeout: 30000,
        data: options.post ? qs.stringify(options.payload) : undefined,
        validateStatus: status => status >= 200 && status < 300
      };
      const response = await axios(axiosOptions);
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const getToken = async () => {
    const html = await fetchData('https://aiovd.com/');
    if (html) {
      const $ = cheerio.load(html);
      return $('#token').val() || false;
    }
    return false;
  };

  try {
    const token = await getToken();
    if (!token) return res.errorJson('Gagal mendapatkan token dari AIOVD.', 500);

    const payload = {
      url: videoUrl,
      token: token
    };

    const responseJson = await fetchData('https://aiovd.com/wp-json/aio-dl/video-data/', {
      post: true,
      payload,
      referer: REFERER
    });

    if (!responseJson) return res.errorJson('Gagal menghubungi API AIOVD.', 500);

    const videoData = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;

    if (!videoData || !videoData.medias || videoData.medias.length === 0) {
      const msg = videoData?.error || 'Gagal memproses data video dari API.';
      return res.errorJson(msg, 500);
    }

    const { source = 'unknown', sid } = videoData;
    if (!sid) return res.errorJson('Gagal mendapatkan SID untuk membuat link download.', 500);

    const downloadLinks = videoData.medias.map((media, index) => {
      const mediaIndexB64 = Buffer.from(String(index)).toString('base64');
      const downloadUrl = `https://aiovd.com/wp-content/plugins/aio-video-downloader/download.php?source=${encodeURIComponent(source)}&media=${encodeURIComponent(mediaIndexB64)}&sid=${encodeURIComponent(sid)}`;
      return {
        url: downloadUrl,
        quality: media.quality || 'N/A',
        extension: media.extension || 'N/A',
        formattedSize: media.formattedSize || 'N/A',
        videoAvailable: media.videoAvailable || false,
        audioAvailable: media.audioAvailable || false
      };
    });

    return res.succesJson({
      title: videoData.title || '',
      thumbnail: videoData.thumbnail || '',
      duration: videoData.duration || '',
      links: downloadLinks
    });

  } catch (err) {
    return res.errorJson('Terjadi kesalahan tak terduga.', 500);
  }
};