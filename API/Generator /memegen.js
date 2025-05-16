const axios = require('axios');

module.exports = async (req, res) => {
  const { text_atas, text_bawah, background } = req.query;
  let url = 'https://api.memegen.link/images/custom';

  if (text_atas || text_bawah) {
    const atas = text_atas ? encodeURIComponent(text_atas) : ' ';
    const bawah = text_bawah ? encodeURIComponent(text_bawah) : ' ';
    url += `/${atas}/${bawah}.png`;
  } else {
    return res.errorJson({ error: 'Parameter text-atas atau text-bawah harus diisi.' }, 400);
  }

  if (background) {
    url += `?background=${encodeURIComponent(background)}`;
  }

  try {
    const response = await axios.get(url, { responseType: 'stream' });
    res.set('Content-Type', 'image/png');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error saat memanggil API memegen:', error);
    res.errorJson({ error: 'Terjadi kesalahan saat memproses permintaan.' });
  }
};