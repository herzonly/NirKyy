const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
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

            if (rank && title && img && img.startsWith('http')) {
                songs.push({ rank, img, title, artist, youtube, spotify });
            }
        });

        res.successJson(songs);
    } catch (error) {
        res.errorJson({ error: 'Failed to fetch data' });
    }
};
