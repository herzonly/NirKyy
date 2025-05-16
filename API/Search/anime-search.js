const axios = require('axios');

module.exports = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.errorJson('Masukkan judul anime yang ingin dicari', 400);
  }

  try {
    const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&sfw`);
    const result = response.data.data;

    if (result.length === 0) {
      return res.errorJson('Anime tidak ditemukan.', 404);
    }

    const anime = result[0];
    const originalSynopsis = anime.synopsis;
    const aiPrompt = `Terjemahkan dan ringkas sinopsis berikut ke dalam Bahasa Indonesia dengan kalimat yang jelas dan santai. Hasilnya hanya berupa teks terjemahan dan ringkasan sinopsis, tanpa format tambahan seperti bullet points, nomor, atau simbol lainnya.
Sinopsis:
${originalSynopsis}`;

    const geminiResponse = await axios.get(`https://nirkyy.koyeb.app/api/v1/gemini?prompt=${encodeURIComponent(aiPrompt)}`);
    const summarizedSynopsis = geminiResponse.data.data;

    const genres = anime.genres.map(genre => genre.name).join(', ');
    const themes = anime.themes.map(theme => theme.name).join(', ');

    res.successJson({
      thumbnail: `https://nirkyy.koyeb.app/api/v1/image-random?query=${encodeURIComponent(anime.title)}`,
      thumb_original: anime.images.jpg.image_url,
      title: anime.title,
      genre: genres,
      theme: themes,
      rating: anime.score,
      sinopsis: summarizedSynopsis.trim(),
      template: `*Title:* ${anime.title}\n*Genre:* ${genres}\n*Theme:* ${themes}\n*Rating:* ${anime.score}\n\n*Sinopsis:* ${summarizedSynopsis.trim()}`
    });
  } catch (error) {
    console.error('Error searching for anime:', error);
    res.errorJson('Terjadi kesalahan saat mencari anime.');
  }
};
