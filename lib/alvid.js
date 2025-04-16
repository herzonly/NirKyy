const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) return res.errorJson('Masukin URL-nya dulu lah ngab :V', 400);
  
  try {
    const getPage = await axios.get('https://on4t.com/online-video-downloader', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
        'Referer': 'https://on4t.com/online-video-downloader'
      }
    });
    
    const $ = cheerio.load(getPage.data);
    const token = $('meta[name="csrf-token"]').attr('content');
    if (!token) return res.errorJson('Token ga ketemu ngab, web-nya error atau berubah?', 500);
    
    const cookies = getPage.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    const encodedUrl = encodeURIComponent(targetUrl);
    const payload = `_token=${token}&link=${encodedUrl}`;
    
    const postData = await axios.post('https://on4t.com/all-video-download', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
        'Referer': 'https://on4t.com/online-video-downloader',
        'Cookie': cookies
      }
    });
    
    if (postData.data && postData.data.result) {
      res.successJson(postData.data.result);
    } else {
      res.errorJson('Gagal dapetin data ngab, link-nya valid ga tuh?', 400);
    }
  } catch (err) {
    res.errorJson(`Oops, error pas scraping: ${err.message || 'Unknown error ngab'}`, 500);
  }
};