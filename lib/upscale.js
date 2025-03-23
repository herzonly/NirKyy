const axios = require("axios");
const { FormData, Blob } = require("formdata-node");

class ImgUpscaler {
  constructor() {
    this.apiUrl = "https://get1.imglarger.com/api/UpscalerNew/UploadNew";
    this.statusUrl = "https://get1.imglarger.com/api/UpscalerNew/CheckStatusNew";
    this.headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "id-ID,id;q=0.9",
      "cache-control": "no-cache",
      connection: "keep-alive",
      origin: "https://imgupscaler.com",
      pragma: "no-cache",
      referer: "https://imgupscaler.com/",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua":
        '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
    };
  }

  async upscale({ imgUrl, scale = 2 }) {
    try {
      const { data: fileBuffer, headers } = await axios.get(imgUrl, {
        responseType: "arraybuffer",
      });
      const ext = headers["content-type"].split("/")[1];
      const formData = new FormData();
      formData.append(
        "myfile",
        new Blob([fileBuffer], { type: `image/${ext}` }),
        `file.${ext}`
      );
      formData.append("scaleRadio", scale.toString());
      const { data } = await axios.post(this.apiUrl, formData, {
        headers: { ...this.headers, ...formData.headers },
      });
      return data.code === 200 && data.data?.code
        ? await this.pollStatus({ jobCode: data.data.code, scale })
        : Promise.reject("Upload failed or invalid response.");
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
      return null;
    }
  }

  async pollStatus({ jobCode, scale }) {
    try {
      while (true) {
        const { data } = await axios.post(
          this.statusUrl,
          { code: jobCode, scaleRadio: scale },
          { headers: { ...this.headers, "content-type": "application/json" } }
        );
        if (data.code === 200 && data.data?.status === "success") return data.data;
        await new Promise((res) => setTimeout(res, 5000));
      }
    } catch (error) {
      console.error("Polling failed:", error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  try {
    const response = await axios.get(url, {
      responseType: "stream",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "max-age=0",
        Connection: "keep-alive",
        Host: "get1.imglarger.com",
        "If-Modified-Since": "Sun, 23 Mar 2025 04:48:21 GMT",
        "If-None-Match": 'W/"67d9295-3f5fb"',
        "Sec-Ch-Ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "Sec-Ch-Ua-Mobile": "?1",
        "Sec-Ch-Ua-Platform": '"Android"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      },
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Content-Length", response.headers["content-length"]);

    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    res.errorJson("Error fetching image");
  }
};