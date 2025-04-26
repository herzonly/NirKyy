const axios = require('axios');

module.exports = (req, res) => {
  const text = req.query.q;

  if (!text) {
    return res.errorJson('Waduh, parameter "q" (query) nya mana, Cuy? Contohnya nih: /play?q=dj komang', 400);
  }

  axios.get(`https://pursky.vercel.app/api/ytplay?q=${text}`)
    .then(response => {
      if (!response.data || !response.data.audio) {
        return res.errorJson('Gagal ngambil link audio dari API eksternal nih, Bre. Coba lagi ya!', 500);
      }

      const audioUrl = response.data.audio;
      const headers = response.data.note?.headers || {};

      return axios({
        method: 'get',
        url: audioUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': headers['User-Agent'] || 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.100 Mobile Safari/537.36',
          'Referer': headers['Referer'] || audioUrl
        }
      });
    })
    .then(audioResponse => {
      const filename = text.replace(/\s+/g, '_');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.mp3"`);
      audioResponse.data.pipe(res);
    })
    .catch(error => {
      console.error('Error fetching or streaming audio:', error.message);
      if (error.response) {
        res.errorJson(`API eksternalnya ngasih error nih, Bre: ${error.response.statusText || error.message}`, error.response.status);
      } else if (error.request) {
        res.errorJson('Nggak ada respons dari API eksternal nih, Cuy.', 500);
      } else {
        res.errorJson(`Ada error internal nih: ${error.message}`, 500);
      }
    });
};
