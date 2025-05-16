const axios = require('axios');

module.exports = async (req, res) => {
  const { nama1, nama2 } = req.query;
  try {
    const response = await axios.get(
      `https://express-vercel-ytdl.vercel.app/kecocokan?nama1=${nama1}&nama2=${nama2}`,
      {
        responseType: 'stream',
      }
    );
    res.setHeader('Content-Type', 'image/jpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.errorJson('Failed to fetch image');
  }
};
