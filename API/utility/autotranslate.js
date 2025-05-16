const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
  try {
    const textToTranslate = req.query.text;
    const targetLang = req.query.lang;

    if (!textToTranslate || !targetLang) {
      return res.errorJson('Waduh, parameter \'text\' atau \'lang\' kok kosong, sih? Butuh itu buat nerjemahin!', 400);
    }

    const randomId = Math.random().toString(36).substring(2, 15);
    const apiUrl = 'https://api.stringtranslate.com/string';

    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
      'Referer': 'https://stringtranslate.com/'
    };

    const requestBody = {
      text: textToTranslate,
      lang: targetLang,
      id: randomId
    };

    const response = await axios.post(apiUrl, requestBody, { headers });

    if (!response.data) {
        return res.errorJson('Yah, dapet respons tapi isinya kosong nih.', 500);
    }

    const $ = cheerio.load(response.data);
    const translatedText = $('#text').text().trim();

    if (!translatedText) {
         return res.errorJson('Hmm, hasil terjemahannya aneh nih, nggak bisa dibaca.', 500);
    }

    res.successJson(translatedText);

  } catch (e) {
    res.errorJson('Yah, gagal nyambung ke server terjemahan nih. Coba lagi nanti ya!', 500);
  }
};
