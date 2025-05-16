const axios = require('axios');

async function jadwal(hari) {
  const hariInggris = {
    senin: 'monday',
    selasa: 'tuesday',
    rabu: 'wednesday',
    kamis: 'thursday',
    jumat: 'friday',
    sabtu: 'saturday',
    minggu: 'sunday',
    monday: 'monday',
    tuesday: 'tuesday',
    wednesday: 'wednesday',
    thursday: 'thursday',
    friday: 'friday',
    saturday: 'saturday',
    sunday: 'sunday',
  };

  const hariInggrisDipilih = hariInggris[hari.toLowerCase()];

  if (!hariInggrisDipilih) {
    return { error: 'Hari tidak valid.' };
  }

  try {
    const response = await axios.get(`https://api.jikan.moe/v4/schedules?filter=${hariInggrisDipilih}`);
    const data = response.data.data;
    const hasil = data.map(anime => ({
      title: anime.title,
      thumbnail: anime.images.jpg.image_url,
      sinopsis: anime.synopsis,
    }));
    return hasil;
  } catch (error) {
    return { error: error.message };
  }
}
 

module.exports = async (req, res) => {
  const hari = req.query.hari;
  if (!hari) {
    return res.errorJson("Hari tidak valid. Masukkan nama hari dalam bahasa Inggris atau Indonesia", 400);
  }
  try {
    const response = await jadwal(hari.trim());
    if (response.includes("Hari tidak valid.")) {
      return res.errorJson(response, 400);
    }
    return res.successJson(response);
  } catch (error) {
    return res.errorJson({ error: error.message });
  }
};