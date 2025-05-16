const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const targetUrl = `https://www.myinstants.com/en/index/id?page=${encodeURIComponent(req.query.page || '1')}`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
      'Referer': 'https://www.myinstants.com/en/index/id/'
    };
    const response = await axios.get(targetUrl, { headers });
    const $ = cheerio.load(response.data);
    const instants = [];
    $('.instants.result-page .instant').each((i, el) => {
      const title = $(el).find('.instant-link').text().trim();
      const onclick = $(el).find('.small-button').attr('onclick');
      let audio = null;
      if (onclick) {
        const match = onclick.match(/play\('([^']+)'/);
        if (match && match[1]) {
          audio = 'https://www.myinstants.com' + match[1];
        }
      }
      if (title && audio) {
        instants.push({ title, audio });
      }
    });
    res.successJson(instants);
  } catch (e) {
    res.errorJson('Yah, gagal nih ngambil datanya!', 500);
  }
};
