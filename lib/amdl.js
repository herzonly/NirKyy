const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const FormData = require('form-data');
const WebSocket = require('ws');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const crypto = require('crypto');

const amdl = (req, res) => {
  const api = {
    base: {
      video: 'https://amp4.cc',
      audio: 'https://amp3.cc'
    }
  };
  
  const headers = {
    Accept: 'application/json',
    'User -Agent': 'Postify/1.0.0',
  };
  
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));
  
  const ytRegex = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/;
  
  const formats = {
    video: ['144p', '240p', '360p', '480p', '720p', '1080p'],
    audio: ['64k', '128k', '192k', '256k', '320k']
  };
  
  const captcha = {
    hashChallenge: async function(salt, number, algorithm) {
      return crypto.createHash(algorithm.toLowerCase()).update(salt + number).digest('hex');
    },
    
    verifyChallenge: async function(challengeData, salt, algorithm, maxNumber) {
      for (let i = 0; i <= maxNumber; i++) {
        if (await this.hashChallenge(salt, i, algorithm) === challengeData) {
          return { number: i, took: Date.now() };
        }
      }
      throw new Error('Captcha verification failed.');
    },
    
    solve: async function(challenge) {
      const { algorithm, challenge: challengeData, salt, maxnumber, signature } = challenge;
      const solution = await this.verifyChallenge(challengeData, salt, algorithm, maxnumber);
      return Buffer.from(
        JSON.stringify({
          algorithm,
          challenge: challengeData,
          number: solution.number,
          salt,
          signature,
          took: solution.took,
        })
      ).toString('base64');
    },
  };
  
  const isUrl = async function(url) {
    if (!url) {
      return {
        status: false,
        code: 400,
        result: {
          error: "Linknya mana? Yakali download kagak ada linknya 🗿"
        }
      };
    }
    
    if (!ytRegex.test(url)) {
      return {
        status: false,
        code: 400,
        result: {
          error: "Lu masukin link apaan sih 🗿 Link Youtube aja bree, kan lu mau download youtube 👍🏻"
        }
      };
    }
    
    return {
      status: true,
      code: 200,
      id: url.match(ytRegex)[3]
    };
  };
  
  const convert = async function(url, format, quality, isAudio = false) {
    try {
      const linkx = await isUrl(url);
      if (!linkx.status) return linkx;
      
      const formatx = isAudio ? formats.audio : formats.video;
      if (!quality || !formatx.includes(quality)) {
        return {
          status: false,
          code: 400,
          result: {
            error: "Formatnya kagak ada bree, pilih yang udah disediain aja yak, jangan nyari yang gak ada 🗿",
            available_fmt: formatx
          }
        };
      }
      
      const fixedURL = `https://youtu.be/${linkx.id}`;
      const base = isAudio ? api.base.audio : api.base.video;
      
      const pages = await client.get(`${base}/`);
      const $ = cheerio.load(pages.data);
      const csrfToken = $('meta[name="csrf-token"]').attr('content');
      
      if (!csrfToken) {
        return {
          status: false,
          code: 500,
          result: {
            error: "CSRFnya kagak ada bree 🙃 lagi problem keknya.. "
          }
        };
      }
      
      const form = new FormData();
      form.append('url', fixedURL);
      form.append('format', format);
      form.append('quality', quality);
      form.append('service', 'youtube');
      
      if (isAudio) {
        form.append('playlist', 'false');
      }
      
      form.append('_token', csrfToken);
      
      const captchaX = await client.get(`${base}/captcha`, {
        headers: {
          ...headers,
          Origin: base,
          Referer: `${base}/`
        },
      });
      
      if (captchaX.data) {
        const solvedCaptcha = await captcha.solve(captchaX.data);
        form.append('altcha', solvedCaptcha);
      }
      
      const endpoint = isAudio ? '/convertAudio' : '/convertVideo';
      const resData = await client.post(`${base}${endpoint}`, form, {
        headers: {
          ...form.getHeaders(),
          ...headers,
          Origin: base,
          Referer: `${base}/`
        },
      });
      
      if (!resData.data.success) {
        return {
          status: false,
          code: 400,
          result: {
            error: resData.data.message
          }
        };
      }
      
      const ws = await connect(resData.data.message, isAudio);
      const dlink = `${base}/dl/${ws.worker}/${resData.data.message}/${encodeURIComponent(ws.file)}`;
      
      return {
        status: true,
        code: 200,
        result: {
          title: ws.title || "Gak tau 🤷🏻",
          type: isAudio ? 'audio' : 'video',
          format: format,
          thumbnail: ws.thumbnail || `https://i.ytimg.com/vi/${linkx.id}/maxresdefault.jpg`,
          download: dlink,
          id: linkx.id,
          duration: ws.duration,
          quality: quality,
          uploader: ws.uploader
        }
      };
      
    } catch (error) {
      return {
        status: false,
        code: 500,
        result: {
          error: "Error ceunah 😂"
        }
      };
    }
  };
  
  const connect = async function(id, isAudio = false) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`wss://${isAudio ? 'amp3' : 'amp4'}.cc/ws`, ['json'], {
        headers: {
          ...headers,
          Origin: `https://${isAudio ? 'amp3' : 'amp4'}.cc`
        },
        rejectUnauthorized: false,
      });
      
      let fileInfo = {};
      let timeoutId = setTimeout(() => {
        ws.close();
        reject({
          status: false,
          code: 408,
          result: {
            error: "Connection timeout, Servernya kagak ngeresponse ceunah bree 🤣"
          }
        });
      }, 30000);
      
      ws.on('open', () => ws.send(id));
      ws.on('message', (data) => {
        const res = JSON.parse(data);
        if (res.event === 'query' || res.event === 'queue') {
          fileInfo = { thumbnail: res.thumbnail, title: res.title, duration: res.duration, uploader: res.uploader };
        } else if (res.event === 'file' && res.done) {
          clearTimeout(timeoutId);
          ws.close();
          resolve({ ...fileInfo, ...res });
        }
      });
      ws.on('error', (err) => {
        clearTimeout(timeoutId);
        reject({
          status: false,
          code: 500,
          result: {
            error: "Yaelah, nih server jelek amat yakk.. Gagal tersambung mulu etdah 😂"
          }
        });
      });
    });
  };
  
  const download = async function(url, format = '720p') {
    try {
      const isAudio = format === 'mp3';
      return await convert(
        url,
        isAudio ? 'mp3' : 'mp4',
        isAudio ? '128k' : format,
        isAudio
      );
    } catch (error) {
      return {
        status: false,
        code: 500,
        result: {
          error: "Error euy 🤣"
        }
      };
    }
  };
  const { url, format } = req.query; 
  download(url, format).then(result => {
    if (result.status) {
      res.succesJson(result);
    } else {
      res.errorJson(result);
    }
  }).catch(err => {
    res.errorJson({ status: false, code: 500, result: { error: "Unexpected error occurred." } });
  });
};

module.exports = { amdl };