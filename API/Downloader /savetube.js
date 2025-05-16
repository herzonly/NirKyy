const axios = require('axios');

module.exports = async function(req, res) {
  const { url, format } = req.query;

  if (!url) return res.errorJson("Masukkan parameter url", 400);
  if (!format) return res.errorJson("Masukkan parameter format", 400);

  try {
    let response;
    
    try {
      response = await axios.get(`https://pursky.vercel.app/api/ytdl?url=${url}&si=HJ1GvDr8o1dNUKcB&format=${format}`);
    } catch (firstError) {
      try {
        response = await axios.get(`https://pursky.vercel.app/api/ytdl?url=${url}&si=HJ1GvDr8o1dNUKcB&format=${format}`);
      } catch (secondError) {
        return res.errorJson(secondError.message || "Error occurred during the request", secondError.response ? secondError.response.status : 500);
      }
    }

    if (response.status !== 200) return res.errorJson("Terjadi kesalahan saat mengunduh video");
    
    return res.successJson(response.data);
  } catch (error) {
    return res.errorJson(error.message || "An unexpected error occurred");
  }
};