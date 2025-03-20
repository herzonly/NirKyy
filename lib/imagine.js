const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) return res.status(400).send('Missing prompt');

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="prompt"\r\n',
      prompt,
      `--${boundary}`,
      'Content-Disposition: form-data; name="output_format"\r\n',
      'bytes',
      `--${boundary}`,
      'Content-Disposition: form-data; name="anonymous_user_id"\r\n',
      'null',
      `--${boundary}`,
      'Content-Disposition: form-data; name="user_id"\r\n',
      'ba70f96a-04ca-4bed-96df-263258f18ef1',
      `--${boundary}`,
      'Content-Disposition: form-data; name="request_timestamp"\r\n',
      `${Date.now() / 1000}`,
      `--${boundary}`,
      'Content-Disposition: form-data; name="user_is_subscribed"\r\n',
      'false',
      `--${boundary}`,
      'Content-Disposition: form-data; name="client_id"\r\n',
      'none',
      `--${boundary}--`
    ].join('\r\n');

    const response = await axios.post('https://ai-api.magicstudio.com/api/ai-art-generator', body, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Origin': 'https://magicstudio.com',
        'Referer': 'https://magicstudio.com/',
        'User-Agent': 'Mozilla/5.0'
      },
      responseType: 'arraybuffer'
    });

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error generating image');
  }
};