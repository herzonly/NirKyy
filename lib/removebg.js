const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

module.exports = async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Mengambil gambar dari URL
    const imageResponse = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream'
    });
    
    // Menyiapkan form-data
    const formData = new FormData();
    formData.append('image', imageResponse.data, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });
    
    // Mengirim permintaan ke API remove background
    const apiResponse = await axios.post(
      'https://ai-api.magicstudio.com/api/remove-background',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin': 'https://magicstudio.com',
          'Referer': 'https://magicstudio.com/background-remover/editor/',
          'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132"',
          'Sec-Ch-Ua-Mobile': '?1',
          'Sec-Ch-Ua-Platform': '"Android"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
        }
      }
    );
    
    // Mengembalikan hasil dari API ke pengguna
    res.json(apiResponse.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};