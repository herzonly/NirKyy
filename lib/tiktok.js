const axios = require('axios');
const { JSDOM } = require('jsdom');
const { URLSearchParams } = require('url');

module.exports = async (req, res) => {
  const tiktokUrl = req.query.url;
  
  if (!tiktokUrl || typeof tiktokUrl !== 'string' || !tiktokUrl.includes('tiktok.com')) {
    return res.errorJson('URL TikTok tidak valid atau tidak disediakan.',400);
  }
  
  const base_url = 'https://tiktokio.com/id/';
  const api_url = 'https://tiktokio.com/api/v1/tk-htmx';
  
  const headers_get = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Referer': 'https://tiktokio.com/id/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };
  
  const headers_post = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Referer': 'https://tiktokio.com/id/',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Hx-Current-Url': 'https://tiktokio.com/id/',
    'Hx-Request': 'true',
    'Hx-Target': '#tiktok-parse-result',
    'Origin': 'https://tiktokio.com',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
  };
  
  try {
    let prefix;
    try {
      const initialResponse = await axios.get(base_url, { headers: headers_get });
      const dom = new JSDOM(initialResponse.data);
      const prefixInput = dom.window.document.querySelector('input[name="prefix"]');
      
      if (!prefixInput || !prefixInput.value) {
        return res.errorJson('Gagal menemukan token prefix yang diperlukan dari halaman utama.');
      }
      prefix = prefixInput.value;
      
    } catch (err) {
      let errorMsg = 'Gagal mengambil halaman awal tiktokio.com.';
      if (axios.isAxiosError(err) && err.response) {
        errorMsg += ` Status: ${err.response.status}`;
      } else if (err instanceof Error) {
        errorMsg += ` Detail: ${err.message}`;
      }
      console.error("Error fetching initial page:", err);
      return res.errorJson(errorMsg);
    }
    
    const postData = new URLSearchParams();
    postData.append('vid', tiktokUrl);
    postData.append('prefix', prefix);
    
    let apiResponseHtml;
    try {
      const apiResponse = await axios.post(api_url, postData.toString(), { headers: headers_post });
      apiResponseHtml = apiResponse.data;
    } catch (err) {
      let errorMsg = 'Gagal mengirim permintaan unduhan ke API tiktokio.';
      if (axios.isAxiosError(err) && err.response) {
        errorMsg += ` Status: ${err.response.status}`;
        if (err.response.status === 404) {
          errorMsg = 'URL TikTok tidak ditemukan atau tidak valid menurut tiktokio.';
          return res.errorJson(errorMsg);
        }
      } else if (err instanceof Error) {
        errorMsg += ` Detail: ${err.message}`;
      }
      console.error("Error during POST request:", err);
      return res.errorJson(errorMsg);
    }
    
    
    const resultDom = new JSDOM(apiResponseHtml);
    const downloadLinks = [];
    
    const linkElements = resultDom.window.document.querySelectorAll('.download-buttons a, a.tk-button-download');
    
    if (linkElements.length === 0) {
      const potentialError = resultDom.window.document.querySelector('.error-message, .alert-danger');
      if (potentialError) {
        return res.errorJson(`Situs tiktokio mengembalikan pesan: ${potentialError.textContent.trim()}`);
      }
      // Fallback check for simpler links if specific classes fail
      const fallbackLinks = resultDom.window.document.querySelectorAll('a[href*="download"]');
      if (fallbackLinks.length > 0) {
        fallbackLinks.forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent.trim();
          if (href && !href.startsWith('javascript:')) {
            downloadLinks.push({ url: href, text: text || 'Tautan Unduhan' });
          }
        });
      } else {
        return res.errorJson('Tidak ada tautan unduhan yang ditemukan dalam respons API. Mungkin URL TikTok tidak valid atau struktur situs telah berubah.',404);
      }
    } else {
      linkElements.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        if (href && !href.startsWith('javascript:')) {
          downloadLinks.push({ url: href, text: text || 'Tautan Unduhan' });
        }
      });
    }
    
    
    if (downloadLinks.length === 0) {
      return res.errorJson('Tidak ada tautan unduhan yang valid ditemukan setelah parsing.',404);
    }
    
    return res.succesJson(downloadLinks);
    
  } catch (error) {
    console.error("Kesalahan umum saat proses scraping:", error);
    return res.errorJson(error.message)
  }
};