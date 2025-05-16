const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const {
      search,
      judul,
      harga,
      thumbnail
    } = req.query;

    if (!search || !judul || !harga || !thumbnail) {
      return res.errorJson('Ups, ada parameter yang kurang nih. Pastikan ada search, judul, harga, dan thumbnail ya.', 400);
    }

    const targetUrl = `https://express-vercel-ytdl.vercel.app/fakeshop-cuy?search=${encodeURIComponent(search)}&judul=${encodeURIComponent(judul)}&harga=${encodeURIComponent(harga)}&thumbnail=${encodeURIComponent(thumbnail)}`;

    const response = await axios.get(targetUrl, {
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'image/jpeg');
    response.data.pipe(res);

  } catch (e) {
    res.errorJson('Yah, ada masalah pas ngambil gambar nih. Coba lagi ya.');
  }
};
