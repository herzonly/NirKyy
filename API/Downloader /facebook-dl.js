const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const videoUrl = req.query.url;

    if (!videoUrl) {
      return res.errorJson('Woi, link videonya mana? Gak ada link, gak bisa kerja gue!', 400);
    }

    const mainPageUrl = 'https://fdownloader.net/id';
    const mainPageResponse = await axios.get(mainPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://fdownloader.net/id'
      }
    });
    const mainPageHtml = mainPageResponse.data;

    const kExpMatch = mainPageHtml.match(/k_exp="([^"]+)"/);
    const kTokenMatch = mainPageHtml.match(/k_token="([^"]+)"/);
    const cTokenMatch = mainPageHtml.match(/c_token="([^"]+)"/);

    if (!kExpMatch || !kTokenMatch || !cTokenMatch) {
      return res.errorJson('Gagal dapetin kunci rahasia dari website sumber, coba lagi nanti!', 500);
    }

    const k_exp = kExpMatch[1];
    const k_token = kTokenMatch[1];
    const c_token = cTokenMatch[1];

    const ajaxSearchUrl = 'https://v3.fdownloader.net/api/ajaxSearch';
    const postData = new URLSearchParams({
      k_exp: k_exp,
      k_token: k_token,
      q: videoUrl,
      lang: 'id',
      web: 'fdownloader.net',
      v: 'v2',
      w: '',
      cftoken: c_token
    }).toString();

    const ajaxResponse = await axios.post(ajaxSearchUrl, postData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://fdownloader.net/id'
      }
    });

    const responseData = ajaxResponse.data;

    if (responseData.status !== 'ok' || !responseData.data) {
      return res.errorJson('Respons dari server target aneh, gak ngasih data yang jelas!', 500);
    }

    const $ = cheerio.load(responseData.data);
    const downloadLinks = [];
    const thumbnail = $('.thumbnail img').attr('src');

    $('table.table tbody tr').each((i, el) => {
      const quality = $(el).find('td.video-quality').text().trim();
      const directLink = $(el).find('a.download-link-fb').attr('href');
      const renderButton = $(el).find('button');

      let url = null;
      let type = 'unknown';

      if (directLink) {
        url = directLink;
        type = 'direct';
      } else if (renderButton.length > 0) {
        const renderUrl = renderButton.attr('data-videourl');
        if (renderUrl) {
          url = renderUrl;
          type = 'render_needed';
        }
      }

      if (quality && url) {
        downloadLinks.push({
          quality: quality,
          url: url,
          type: type
        });
      }
    });

    if (downloadLinks.length === 0) {
      return res.errorJson('Astaga, gak nemu link download sama sekali! Mungkin link lu salah atau videonya gak bisa diunduh.', 404);
    }

    res.successJson({ thumbnail, links: downloadLinks });

  } catch (e) {
    res.errorJson('Waduh, server lagi ngadat nih! Ada error internal, coba lagi nanti ya.', 500);
  }
};
