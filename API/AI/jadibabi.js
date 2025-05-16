const axios = require('axios');

module.exports = async (req, res) => {
    const imageUrl = req.query.url;
    const filterName = 'piggy';
    const apiEndpoint = 'https://negro.consulting/api/process-image';
    const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36';
    const referer = 'https://negro.consulting/#tools';

    if (!imageUrl) {
        return res.errorJson('Parameter URL gambar diperlukan.', 400);
    }

    let imageResponse;
    try {
        imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        if (imageResponse.status !== 200) {
             throw new Error(`Gagal mengambil gambar dari URL. Status: ${imageResponse.status}`);
        }

    } catch (error) {
        const status = error.response ? error.response.status : 500;
        return res.errorJson(`Gagal mengambil gambar dari URL: ${error.message}`, status);
    }

    try {
        const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

        const payload = {
            imageData: base64Image,
            filter: filterName
        };

        const apiResponse = await axios.post(apiEndpoint, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': userAgent,
                'Referer': referer,
            },
            timeout: 30000
        });

        if (apiResponse.status >= 200 && apiResponse.status < 300) {
            const responseData = apiResponse.data;
            if (responseData && responseData.status === 'success' && responseData.processedImageUrl) {
                try {
                    let base64Data = responseData.processedImageUrl;
                    let contentType = 'image/jpeg';

                    if (base64Data.startsWith('data:')) {
                        const parts = base64Data.match(/^data:(image\/[a-z]+);base64,(.*)$/);
                        if (parts && parts.length === 3) {
                            contentType = parts[1];
                            base64Data = parts[2];
                        } else {
                             base64Data = base64Data.split(',')[1] || base64Data;
                        }
                    }

                    const imageBuffer = Buffer.from(base64Data, 'base64');

                    res.setHeader('Content-Type', contentType);
                    res.send(imageBuffer);

                } catch (decodeError) {
                    console.error("Error decoding Base64 data:", decodeError.message);
                    return res.errorJson('Gagal mendekode data gambar Base64 dari API.', 500);
                }
            } else {
                 const message = `API mengembalikan respon tidak sukses atau data tidak ditemukan. Status: ${responseData?.status ?? 'N/A'}`;
                 return res.errorJson(message, 502);
            }
        } else {
             return res.errorJson(`API mengembalikan HTTP status code: ${apiResponse.status}`, apiResponse.status);
        }

    } catch (error) {
         let status = 500;
         let message = `Terjadi error saat memproses gambar: ${error.message}`;

         if (axios.isAxiosError(error)) {
            if (error.response) {
                status = error.response.status;
                message = `Error dari API (${status}): ${JSON.stringify(error.response.data || error.message)}`;
            } else if (error.request) {
                status = 504;
                message = `Tidak ada respon dari API: ${error.message}`;
            }
         }
        return res.errorJson(message, status);
    }
};
