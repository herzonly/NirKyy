const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const {
      url,
      browserWidth,
      browserHeight,
      fullPage,
      deviceScaleFactor,
      format
    } = req.query;

    if (!url) {
      return res.errorJson('Parameter "url" wajib diisi, bego!', 400);
    }

    const screenshotPayload = {
      url: url,
      browserWidth: browserWidth ? parseInt(browserWidth, 10) : 1280,
      browserHeight: browserHeight ? parseInt(browserHeight, 10) : 720,
      fullPage: fullPage ? fullPage === 'true' : false,
      deviceScaleFactor: deviceScaleFactor ? parseFloat(deviceScaleFactor) : 1,
      format: format || 'png'
    };

    const screenshotApiUrl = 'https://gcp.imagy.app/screenshot/createscreenshot';
    const screenshotResponse = await axios.post(screenshotApiUrl, screenshotPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://imagy.app/full-page-screenshot-taker/'
      }
    });

    const fileUrl = screenshotResponse.data.fileUrl;

    if (!fileUrl) {
      return res.errorJson('API screenshot-nya pelit, gak ngasih URL file. Brengsek!', 500);
    }

    const imageResponse = await axios.get(fileUrl, {
      responseType: 'stream'
    });

    const contentType = imageResponse.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      res.setHeader('Content-Type', `image/${screenshotPayload.format}`);
    }

    imageResponse.data.pipe(res);

    imageResponse.data.on('error', (err) => {
      console.error(`Gagal nyedot gambar stream-nya: ${err.message}`);
      if (!res.headersSent) {
        res.errorJson(`Gagal nyedot gambar stream-nya. Ada apa nih?! ${err.message}`, 500);
      }
    });

  } catch (e) {
    console.error(`Ada error tolol di prosesnya: ${e.message}`);
    if (!res.headersSent) {
      res.errorJson(`Ada error tolol di prosesnya: ${e.message}`, e.response ? e.response.status : 500);
    }
  }
};
