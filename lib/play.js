const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.errorJson('Parameter query (q) diperlukan', 400);
    
    const searchResponse = await axios.get('https://nirkyy.koyeb.app/api/v1/youtube-search', {
      params: { query }
    });
    
    if (!searchResponse.data || !searchResponse.data.success || !Array.isArray(searchResponse.data.data)) {
      return res.errorJson('Gagal melakukan pencarian YouTube', 500);
    }
    
    const videos = searchResponse.data.data;
    const filtered = videos.filter(v => {
      if (!v.duration) return false;
      const parts = v.duration.split(':').map(Number);
      const dur = parts.length === 3 ?
        parts[0] * 3600 + parts[1] * 60 + parts[2] :
        parts[0] * 60 + parts[1];
      return dur < 600;
    });
    
    if (!filtered.length) return res.errorJson('Tidak ada video berdurasi <10 menit', 404);
    const videoUrl = filtered[0].url;
    
    const infoRes = await axios.get('https://p.oceansaver.in/ajax/download.php', {
      params: {
        copyright: 0,
        format: 'mp3',
        url: videoUrl,
        api: 'dfcb6d76f2f6a9894gjkege8a4ab232222'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
        'Referer': 'https://ytmp3.so/enbS/'
      }
    });
    
    if (!infoRes.data || !infoRes.data.success || !infoRes.data.id) {
      return res.errorJson('Gagal mengambil info download', 500);
    }
    
    const id = infoRes.data.id;
    let downloadUrl = null;
    let attempts = 0;
    
    while (attempts < 15) {
      const progressRes = await axios.get('https://p.oceansaver.in/api/progress', {
        params: { id },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
          'Referer': 'https://ytmp3.so/enbS/'
        }
      });
      
      if (progressRes.data && progressRes.data.success === 1 && progressRes.data.progress === 1000 && progressRes.data.download_url) {
        downloadUrl = progressRes.data.download_url;
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (!downloadUrl) return res.errorJson('Download tidak siap setelah menunggu', 503);
    
    const audioRes = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
        'Referer': 'https://ytmp3.so/enbS/'
      }
    });
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioRes.data);
    
  } catch (err) {
    let msg = 'Terjadi kesalahan internal';
    let code = 500;
    if (err.response) {
      msg = `API error: ${err.response.status} - ${JSON.stringify(err.response.data) || err.message}`;
      code = err.response.status;
    } else if (err.request) {
      msg = `Tidak ada respons diterima: ${err.message}`;
      code = 503;
    } else {
      msg = `Request error: ${err.message}`;
    }
    if (!res.headersSent) res.errorJson(msg, code);
    else console.error('Error setelah headers dikirim:', err);
  }
};