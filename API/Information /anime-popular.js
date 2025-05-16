const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
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

    res.successJson(result);
  } catch (error) {
    res.errorJson({ error: error.message });
  }
};
