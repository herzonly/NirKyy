const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.errorJson('Parameter query (q) diperlukan', 400);
    }
    
    const searchResponse = await axios.get('https://nirkyy.koyeb.app/api/v1/youtube-search', {
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
    
    const audioResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': targetUrl,
        'Origin': 'https://www.youtube.com',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Connection': 'keep-alive'
      }
    });
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioResponse.data);
    
  } catch (error) {
    let errorMessage = 'Terjadi kesalahan internal';
    let statusCode = 500;
    
    if (error.response) {
      const contentType = error.response.headers['content-type'] || '';
      if (contentType.includes('text/html') && Buffer.isBuffer(error.response.data)) {
        const htmlError = Buffer.from(error.response.data).toString('utf8');
        console.error('Isi halaman HTML error:', htmlError.slice(0, 500)); // Tampilkan 500 karakter pertama
      }
      errorMessage = `Error dari API: ${error.response.status} - ${error.message}`;
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