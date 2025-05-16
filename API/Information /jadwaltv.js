const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const channel = req.query.channel ? req.query.channel.toLowerCase().trim() : '';
  if (!channel) {
    return res.errorJson({ error: 'Channel parameter is required' },400);
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
    res.successJson(result);
  } catch (err) {
    res.errorJson({ error: err.toString() });
  }
};
