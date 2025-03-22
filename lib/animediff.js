const axios = require('axios');
const FormData = require('form-data');

function DeepAi(req, res) {
  const endpoint = 'https://api.deepai.org/api/anime-portrait-generator';
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0';
  const apiKey = generateTryItApiKey(userAgent);
  
  function generateTryItApiKey(userAgent) {
    const myrandomstr = Math.round(Math.random() * 100000000000).toString();
    const myhashfunction = (function() {
      const a = [];
      for (let b = 0; b < 64; b++) {
        a[b] = 0 | (4294967296 * Math.sin((b + 1) % Math.PI));
      }
      return function(c) {
        let d, e, f;
        let g = [(d = 1732584193), (e = 4023233417), ~d, ~e];
        let h = [];
        let l = unescape(encodeURI(c)) + "\u0080";
        let k = l.length;
        c = ((--k) / 4 + 2) | 15;
        h[c - 1] = 8 * k;
        while (k > 0) {
          h[k >> 2] |= l.charCodeAt(k) << (8 * (k % 4));
          k--;
        }
        for (let b = 0, lIndex = 0; b < c; b += 16) {
          let kArr = g.slice();
          for (lIndex = 0; lIndex < 64; lIndex++) {
            const idx = lIndex >> 4;
            const kIndex = [lIndex, 5 * lIndex + 1, 3 * lIndex + 5, 7 * lIndex][idx] & 15;
            const shift = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * idx + (lIndex % 4)];
            const fTemp = kArr[0] + (
              [(kArr[0] & kArr[1]) | (~kArr[0] & kArr[2]),
                (kArr[2] & kArr[0]) | (~kArr[2] & kArr[1]),
                kArr[0] ^ kArr[1] ^ kArr[2],
                kArr[1] ^ (kArr[0] | ~kArr[2])
              ][idx] + a[lIndex] + ~~h[b | kIndex]
            );
            const temp = kArr[1] + ((fTemp << shift) | (fTemp >>> (32 - shift)));
            kArr = [temp, kArr[0], kArr[1], kArr[2]];
          }
          for (let j = 0; j < 4; j++) {
            g[j] = (g[j] + kArr[j]) >>> 0;
          }
        }
        let hashStr = "";
        for (let l = 0; l < 32; l++) {
          hashStr += ((g[l >> 3] >> (4 * (1 ^ l)) & 15)).toString(16);
        }
        return hashStr.split("").reverse().join("");
      };
    })();
    return 'tryit-' + myrandomstr + '-' + myhashfunction(userAgent + myhashfunction(userAgent + myhashfunction(userAgent + myrandomstr + 'suditya_is_a_smelly_hacker')));
  }
  
  const form = new FormData();
  form.append('text', req.query.prompt);
  
  axios.post(endpoint, form, {
      headers: {
        'api-key': apiKey,
        'User-Agent': userAgent,
        ...form.getHeaders()
      }
    }).then(response => res.succesJson(response.data))
    .catch(error => res.errorJson({ error: error.response ? error.response.data : error.message }));
}

module.exports = DeepAi;