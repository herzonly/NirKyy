const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.errorJson('Parameter query (q) diperlukan', 400);
    }

    const searchResponse = await axios.get('https://nirkyy.koyeb.app/api/v1/Youtube', {
      params: { query }
    });

    if (!searchResponse.data || !searchResponse.data.success || !Array.isArray(searchResponse.data.data)) {
      return res.errorJson('Gagal melakukan pencarian YouTube atau format respons tidak valid', 500);
    }

    const videos = searchResponse.data.data;

    const filteredVideos = videos.filter(video => {
      if (!video.duration || typeof video.duration !== 'string') return false;
      const parts = video.duration.split(':');
      if (parts.length < 2 || parts.length > 3) return false;
      let durationInSeconds = 0;
      if (parts.length === 3) {
        durationInSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      } else {
        durationInSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      return !isNaN(durationInSeconds) && durationInSeconds < 600;
    });

    if (filteredVideos.length === 0) {
      return res.errorJson('Tidak ada video ditemukan dengan durasi di bawah 10 menit', 404);
    }

    const targetUrl = filteredVideos[0].url;

    const saveTubeResponse = await axios.get('https://nirkyy.koyeb.app/api/v1/savetube', {
      params: {
        url: targetUrl,
        format: 'mp3'
      }
    });

    if (!saveTubeResponse.data || !saveTubeResponse.data.success || !saveTubeResponse.data.data || !saveTubeResponse.data.data.download) {
      return res.errorJson('Gagal mendapatkan link download dari Savetube atau format respons tidak valid', 500);
    }

    const downloadUrl = saveTubeResponse.data.data.download;
    const audioTitle = saveTubeResponse.data.data.title || 'audio';

    const audioResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36'
      }
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioResponse.data);

  } catch (error) {
    let errorMessage = 'Terjadi kesalahan internal';
    let statusCode = 500;
    if (error.response) {
      errorMessage = `Error dari API: ${error.response.status} - ${JSON.stringify(error.response.data) || error.message}`;
      statusCode = error.response.status;
    } else if (error.request) {
      errorMessage = `Tidak ada respons diterima: ${error.message}`;
      statusCode = 503; 
    } else {
      errorMessage = `Error konfigurasi request: ${error.message}`;
    }
    if (!res.headersSent) {
      res.errorJson(errorMessage, statusCode);
    } else {
      console.error('Error after headers sent:', error);
    }
  }
};
