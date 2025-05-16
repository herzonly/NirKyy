const axios = require('axios');

module.exports = async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.errorJson('Eh, URL gambarnya mana nih? Kasih dong di query "url".', 400);
  }

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await axios.post(
        'https://fluxai.pro/api/prompts/describe',
        {
          url: imageUrl,
          type: 'more-detailed'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
            'Referer': 'https://fluxai.pro/image-to-prompt'
          }
        }
      );

      if (response.status === 200) {
        return res.successJson(response.data.results);
      } else {
        if (response.status === 400) {
          return res.errorJson(`API-nya protes nih, error 400. Mungkin URL gambarnya salah? Pesannya: ${response.data.message || 'Gak ada pesan spesifik.'}`, 400);
        }
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return res.errorJson(`API-nya nolak nih, error 400. Cek lagi URL gambarnya ya. Pesannya: ${error.response.data.message || 'Gak ada pesan spesifik.'}`, 400);
      }
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        return res.errorJson(`Udah dicoba ${maxRetries} kali tapi masih error nih. Jaringan atau API-nya lagi ngadat kali ya?`, error.response ? error.response.status : 500);
      }
    }
  }
};