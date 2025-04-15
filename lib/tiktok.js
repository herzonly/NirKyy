const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.errorJson('Parameter "url" tidak ditemukan');
    }
    const getPage = await axios.get('https://on4t.com/tiktok-video-download', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://on4t.com/tiktok-video-download'
      }
    });
    const setCookie = getPage.headers['set-cookie'];
    if (!setCookie) {
      return res.errorJson('Gagal mengambil cookie dari server', 500);
    }
    const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    const $ = cheerio.load(getPage.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    if (!csrfToken) {
      return res.errorJson('Gagal mengambil CSRF token dari halaman', 500);
    }
    const response = await axios.post(
      'https://on4t.com/tiktok-video-download',
      new URLSearchParams({ link: url }).toString(),
      {
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://on4t.com/tiktok-video-download#inner-result',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookie
        }
      }
    );
    res.succesJson(response.data);
  } catch (error) {
    res.errorJson('Terjadi kesalahan: ' + error.message, 500);
  }
};
