const axios = require('axios');

const pinterestApi = {
  base: "https://www.pinterest.com",
  endpoints: {
    search: "/resource/BaseSearchResource/get/",
    pin: "/resource/PinResource/get/",
    user: "/resource/UserResource/get/"
  }
};

const pinterestHeaders = {
  'accept': 'application/json, text/javascript, */*, q=0.01',
  'referer': 'https://www.pinterest.com/',
  'user-agent': 'Postify/1.0.0',
  'x-app-version': 'a9522f',
  'x-pinterest-appstate': 'active',
  'x-pinterest-pws-handler': 'www/[username]/[slug].js',
  'x-pinterest-source-url': '/search/pins/?rs=typed&q=kucing%20anggora/',
  'x-requested-with': 'XMLHttpRequest'
};

const isUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
};

const getCookies = async () => {
  try {
    const response = await axios.get(pinterestApi.base);
    const setHeaders = response.headers['set-cookie'];
    if (setHeaders) {
      const cookies = setHeaders.map(cookieString => {
        const cp = cookieString.split(';');
        const cv = cp[0].trim();
        return cv;
      });
      return cookies.join('; ');
    }
    return null;
  } catch (error) {
    console.error("Error retrieving cookies:", error);
    return null;
  }
};

const pinSearch = async (query, limit = 10) => {
  if (!query) {
    return {
      status: false,
      code: 400,
      result: { message: "Search query cannot be empty." }
    };
  }
  try {
    const cookies = await getCookies();
    if (!cookies) {
      return {
        status: false,
        code: 400,
        result: { message: "Failed to retrieve cookies." }
      };
    }
    const params = {
      source_url: `/search/pins/?q=${query}`,
      data: JSON.stringify({
        options: {
          isPrefetch: false,
          query: query,
          scope: "pins",
          bookmarks: [""],
          no_fetch_context_on_resource: false,
          page_size: limit
        },
        context: {}
      }),
      _: Date.now()
    };
    
    const { data } = await axios.get(`${pinterestApi.base}${pinterestApi.endpoints.search}`, {
      headers: { ...pinterestHeaders, 'cookie': cookies },
      params: params
    });
    
    const container = [];
    const results = data.resource_response.data.results.filter((v) => v.images?.orig);
    results.forEach((result) => {
      container.push({
        id: result.id,
        title: result.title || "",
        description: result.description,
        pin_url: `https://pinterest.com/pin/${result.id}`,
        media: {
          images: {
            orig: result.images.orig,
            small: result.images['236x'],
            medium: result.images['474x'],
            large: result.images['736x']
          },
          video: result.videos ? {
            video_list: result.videos.video_list,
            duration: result.videos.duration,
            video_url: result.videos.video_url
          } : null
        },
        uploader: {
          username: result.pinner.username,
          full_name: result.pinner.full_name,
          profile_url: `https://pinterest.com/${result.pinner.username}`
        }
      });
    });
    
    if (container.length === 0) {
      return {
        status: false,
        code: 404,
        result: { message: `No results found for query: "${query}".` }
      };
    }
    
    return {
      status: true,
      code: 200,
      result: {
        query: query,
        total: container.length,
        pins: container
      }
    };
    
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const message = statusCode === 500 ?
      "Server error occurred. Please try again later." :
      `Request failed with status code ${statusCode}.`;
    
    return {
      status: false,
      code: statusCode,
      result: { message: message }
    };
  }
};


const pin = {
  search: pinSearch
};

module.exports = async function(req, res) {
  const { query } = req.query;
  if (!query) return res.errorJson("Search query cannot be empty.", 400);
  
  try {
    const result = await pin.search(query);
    if (result.status) {
      return res.successJson(result.result);
    } else {
      return res.errorJson(result.result);
    }
  } catch (error) {
    return res.errorJson(error.message);
  }
};