const express = require('express');
const router = express.Router();
const axios = require('axios');
const { alldown } = require('alldown');
const { handleTextQuery } = require('../lib/ai');
const { pin } = require('../lib/pinterest');
const { jadwal } = require('../lib/animeJadwal');
const { savetube } = require('../lib/savetube');

router.get('/savetube', async (req, res) =>{
  let { url, format } = req.query;
  if (!url) return res.json({ status: false, message: 'Masukkan parameter url' });
  if (!format) {
    format="240";
  }
  try {
    const result = await savetube(url, format);
    if (!result.status) return res.status(result.code).errorJson(result.error);
    res.succesJson(result.result);
  } catch (error) {
    res.status(500).errorJson(error.message);
  }
})

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