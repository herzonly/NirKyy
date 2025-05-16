const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
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

        res.successJson({
            judul,
            deskripsi,
            gambar
        });
    } catch (error) {
        console.error("Error fetching Wikipedia data:", error);
        res.errorJson('Gagal mengambil data');
    }
};
