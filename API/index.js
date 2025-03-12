const express = require('express');
const router = express.Router();

const axios = require('axios');
const { alldown } = 
require('alldown');

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