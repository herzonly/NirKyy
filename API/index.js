const express = require('express');
const router = express.Router();
const axios = require('axios');
const { alldown } = require('alldown');
const { handleTextQuery } = require('../lib/ai');
const { pin } = require('../lib/pinterest');
const { jadwal } = require('../lib/animeJadwal');

router.get('/autogempa', async (req, res) => {
  try {
    const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
    const data = response.data;

    if (data && data.Infogempa && data.Infogempa.gempa) {
      data.Infogempa.gempa.Shakemap = "https://data.bmkg.go.id/DataMKG/TEWS/" + data.Infogempa.gempa.Shakemap;
      res.succesJson(data.Infogempa.gempa);
    } else {
      res.status(404).errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' });
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data autogempa:', error);

    if (error.response) {
      res.status(error.response.status).errorJson({ message: `Kesalahan server: ${error.response.statusText}` });
    } else if (error.request) {
      res.status(500).errorJson({ message: 'Tidak dapat terhubung ke server BMKG.' });
    } else {
      res.status(500).errorJson({ message: 'Terjadi kesalahan saat mengambil data autogempa.' });
    }
  }
});

router.get('/susunkata', async (req, res) => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/susunkata.json');
    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomItem = data[randomIndex];
      res.succesJson(randomItem);
    } else {
      res.status(404).errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' });
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data:', error);
    res.status(500).errorJson({ message: 'Terjadi kesalahan saat mengambil data.' });
  }
});

router.get('/asahotak', async (req, res) => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/asahotak.json');
    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomItem = data[randomIndex];
      res.succesJson(randomItem);
    } else {
      res.status(404).errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' });
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data:', error);
    res.status(500).errorJson({ message: 'Terjadi kesalahan saat mengambil data.' });
  }
});

router.get('/savetube', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).errorJson("Masukkan parameter url");
  if (!format) return res.status(400).errorJson("Masukkan parameter format");
  try {
    const response = await axios.get(`https://pursky.vercel.app/api/ytdl?url=${url}?si=HJ1GvDr8o1dNUKcB&format=${format}`);
    if (response.status !== 200) return res.status(500).errorJson("Terjadi kesalahan saat mengunduh video");
    return res.succesJson(response.data);
  } catch (error) {
    return res.status(500).errorJson(error);
  }
});

router.get('/anime-jadwal', async (req, res) => {
  const hari = req.query.hari;

  if (!hari) {
    return res.status(400).errorJson("Hari tidak valid. Masukkan nama hari dalam bahasa Inggris atau Indonesia")
  }

  try {
    const response = await jadwal(hari.trim());
    if (response.includes("Hari tidak valid.")){
      return res.status(400).errorJson(response)
    }
    return res.succesJson(response);
  } catch (error) {
    return res.status(500).errorJson({ error: error.message });
  }
});

router.get('/pin', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).errorJson("Search query cannot be empty.");
  try {
    const result = await pin.search(query);
    if (result.status) {
      return res.succesJson(result.result);
    } else {
      return res.status(result.code).errorJson(result.result);
    }
  } catch (error) {
    return res.status(500).errorJson(error.message);
  }
});

router.get('/llm', async (req, res) => {
  let { groqKey, model = 'gemma2-9b-it', systemPrompt = " ", msg, user } = req.query;
  if (!groqKey) return res.status(400).errorJson("groqKey is required");
  if (!msg) return res.status(400).errorJson("msg is required");
  if (!user) return res.status(400).errorJson("user is required");
  if (groqKey.includes('Bearer')) groqKey = groqKey.replace('Bearer ', '').trim();
  try {
    const response = await handleTextQuery({ groqKey, model, systemPrompt, msg, user });
    if (response.reply.includes('API Error')) return res.status(401).errorJson(response.reply);
    return res.succesJson(response);
  } catch (error) {
    return res.status(500).errorJson(error);
  }
});

router.get('/aio-dl', async (req, res) => {
  const query = req.query.url;
  if (!query) return res.status(400).errorJson("Masukkan parameter url");
  try {
    const data = await alldown(query);
    if (!data.data) return res.status(500).errorJson("Terjadi kesalahan saat mengunduh video");
    return res.succesJson(data.data);
  } catch (error) {
    return res.status(500).errorJson(error);
  }
});

module.exports = router;