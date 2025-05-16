const axios = require('axios');

module.exports = async (req, res) => {
  const { user, system, prompt } = req.query;

  if (!user || !system || !prompt) {
    return res.errorJson('Isi lengkap dulu cuy, butuh user, system, sama prompt', 400);
  }

  try {
    const response = await axios.post(
      `https://copper-ambiguous-velvet.glitch.me/chat?user=${encodeURIComponent(user)}`,
      {
        message: prompt,
        systemPrompt: system
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.38 Mobile Safari/537.36',
          'Referer': 'https://copper-ambiguous-velvet.glitch.me/'
        }
      }
    );

    res.successJson(response.data);

  } catch (err) {
    console.error('Error calling external API:', err);
    res.errorJson('Gagal cuy, ada masalah waktu ambil data', 500);
  }
};
