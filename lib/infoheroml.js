const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
  try {
    const heroName = req.query.query;

    if (!heroName) {
      return res.errorJson('Dih, nama heronya mana? Gak niat banget sih nyari data!', 400);
    }

    const targetUrl = `https://mobile-legends.fandom.com/wiki/${heroName}`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Mobile Safari/537.36',
      'Referer': targetUrl
    };

    const response = await axios.get(targetUrl, { headers });
    const $ = cheerio.load(response.data);

    const dataHero = {};

    const infobox = $('aside.portable-infobox').first();

    const gambar = [];
    infobox.find('.pi-image-collection__image').each((i, el) => {
      const img = $(el).find('img');
      const url = img.attr('data-src') || img.attr('src');
      const caption = $(el).find('.pi-hero-caption').text().trim();
      if (url) {
        gambar.push({ url, keterangan: caption });
      }
    });
    if (gambar.length > 0) {
      dataHero.gambar = gambar;
    }

    const dataInfobox = {};
    let currentSection = 'info_umum';
    dataInfobox[currentSection] = {};

    infobox.children().each((i, el) => {
      const element = $(el);
      if (element.hasClass('pi-item') && element.hasClass('pi-data')) {
        const label = element.find('.pi-data-label').text().trim();
        const value = element.find('.pi-data-value').text().trim();
        if (label && value) {
          let key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          dataInfobox[currentSection][key] = value;
        }
      } else if (element.hasClass('pi-item') && element.hasClass('pi-group')) {
        const header = element.find('.pi-header').text().trim();
        if (header) {
          currentSection = header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          dataInfobox[currentSection] = {};

           element.find('.pi-item.pi-data').each((j, dataEl) => {
             const label = $(dataEl).find('.pi-data-label').text().trim();
             const value = $(dataEl).find('.pi-data-value').text().trim();
              if (label && value) {
                let key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
                 dataInfobox[currentSection][key] = value;
               }
           });
        }
      } else if (element.hasClass('pi-item') && element.hasClass('pi-hero')) {
           const heroTitle = element.find('.pi-hero-title').text().trim();
           if (heroTitle) {
             dataInfobox.nama_hero = heroTitle;
           }
      }
    });

    for (const section in dataInfobox) {
        if (Object.keys(dataInfobox[section]).length === 0) {
            delete dataInfobox[section];
        }
    }

    if (Object.keys(dataInfobox).length > 0) {
      dataHero.data_infobox = dataInfobox;
    }


    const statsTable = $('table.wikitable').first();
    const statistikDasar = [];
    statsTable.find('tbody tr').each((i, el) => {
      if (i < 2) return;
      const cells = $(el).find('td');
      if (cells.length === 4) {
        const atribut = $(cells[0]).text().trim();
        const level1 = $(cells[1]).text().trim();
        const level15 = $(cells[2]).text().trim();
        const pertumbuhan = $(cells[3]).text().trim();
        if (atribut && level1 && level15 && pertumbuhan) {
           statistikDasar.push({ atribut, level1, level15, pertumbuhan });
        }
      } else if (cells.length === 2) {
         const atribut = $(cells[0]).text().trim();
         const value = $(cells[1]).text().trim();
         if (atribut && value) {
            statistikDasar.push({ atribut, nilai: value });
         }
      }
    });

    if (statistikDasar.length > 0) {
      dataHero.statistik_dasar = statistikDasar;
    }

    const filteredDataHero = Object.fromEntries(
        Object.entries(dataHero).filter(([_, value]) => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            if (typeof value === 'object' && value !== null) {
                return Object.keys(value).length > 0;
            }
            return value !== null && value !== undefined && value !== '';
        })
    );

    res.succesJson(filteredDataHero);

  } catch (e) {
    res.errorJson('Dih, error nih! Gagal ambil data hero. Salahin jaringannya sana!', 500);
  }
};

