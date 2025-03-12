const express = require('express');
const router = express.Router();
const axios = require('axios');
const { alldown } = 
require('alldown');
const { handleTextQuery } = require('../lib/ai');

router.get('/llm', async (req, res) =>{
  const { groqKey, model = 'gemma2-9b-it', systemPrompt = " ", msg, user } = req.query;
  if (!groqKey) return res.status(400).errorJson("groqKey is required");
  if (!msg) return res.status(400).errorJson("msg is required");
  if (!user) return res.status(400).errorJson("user is required");

  if (groqKey.includes('Bearer')) groqKey = groqKey.replace('Bearer ', '').trim();
  try {
    handleTextQuery({ groqKey, model, systemPrompt, msg, user }).then(response => {
    if (response.reply.includes('API Error')) return res.status(401).errorJson(response.reply);
      res.status(200).succesJson(response);
    })
  } catch (error) {
    res.status(500).errorJson(error);
  }
});

router.get('/aio-dl', async (req, res) => {
  const query = req.query.url;
  if (!query) return res.status(400).errorJson("Masukkan parameter url");
  try {
    alldown(query).then(async (data) => {
      if (!data.data) return res.status(500).errorJson("Terjadi kesalahan saat mengunduh video");
      res.status(200).succesJson(data.data);
    })
  } catch (error) {
    res.status(500).errorJson(error);
  }
})

module.exports = router;