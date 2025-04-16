const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const url = req.query.url;
  if (!url) return res.errorJson('URL-nya mana bre? Kirim dulu dong!');
  
  try {
    const response = await axios.post('https://tiksave.io/api/ajaxSearch', new URLSearchParams({
      q: url,
      lang: 'id'
    }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
        'Referer': 'https://tiksave.io/id'
      }
    });
    
    const json = response.data;
    if (!json || json.status !== 'ok' || !json.data) {
      return res.errorJson('Gagal dapetin data bre, response-nya gak valid cuy!', 500);
    }
    
    const $ = cheerio.load(json.data);
    const thumbnail = $('.image-tik img').attr('src') || null;
    const title = $('.content h3').text() || null;
    
    const downloads = [];
    $('.dl-action a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (href) downloads.push({ label: text, url: href });
    });
    
    return res.successJson({
      title,
      thumbnail,
      downloads
    });
    
  } catch (err) {
    return res.errorJson(`Waduh bre, error pas scraping: ${err.message}`, 500);
  }
};