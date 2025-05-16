const axios = require('axios')
const cheerio = require('cheerio')

module.exports = async function(req, res) {
  try {
    const initialUrl = 'https://on4t.com/online-video-downloader'
    const downloadUrl = 'https://on4t.com/all-video-download'
    const userUrl = req.query.url
    
    if (!userUrl) {
      return res.errorJson('Link-nya mana, Bos? Kasih link dong!', 400)
    }
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
      'Referer': initialUrl,
    }
    
    const initialResponse = await axios.get(initialUrl, { headers })
    
    const $ = cheerio.load(initialResponse.data)
    const csrfToken = $('meta[name="csrf-token"]').attr('content')
    
    if (!csrfToken) {
      return res.errorJson('Gagal nemu token keamanan, coba lagi!', 500)
    }
    
    let cookies = '';
    if (initialResponse.headers['set-cookie']) {
      cookies = initialResponse.headers['set-cookie'].join('; ');
    }
    
    const downloadHeaders = {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': '*/*',
      'X-Requested-With': 'XMLHttpRequest',
    }
    
    if (cookies) {
      downloadHeaders['Cookie'] = cookies;
    }
    
    const postData = new URLSearchParams();
    postData.append('_token', csrfToken);
    postData.append('link[]', userUrl);
    
    const downloadResponse = await axios.post(downloadUrl, postData.toString(), { headers: downloadHeaders })
    
    if (downloadResponse.data && downloadResponse.data.result) {
      const extractedData = downloadResponse.data.result.map(item => ({
        title: item.title,
        videoimg_file_url: item.videoimg_file_url,
        video_file_url: item.video_file_url,
        image: item.image
      }));
      res.successJson(extractedData)
    } else {
      res.errorJson('Respons dari server gak sesuai harapan, coba link lain!', 500);
    }
    
  } catch (e) {
    res.errorJson('Yah, gagal ngambil data nih. Coba lagi ya!', 500)
  }
}