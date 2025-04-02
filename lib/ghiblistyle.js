const axios = require('axios');
const { URL } = require('url');

module.exports = async (req, res) => {
    const apiBase = "https://ghiblistyleimagegenerator.cc/api";
    const apiEndpoint = "/generate-ghibli";
    const headers = {
        'authority': 'ghiblistyleimagegenerator.cc',
        'origin': 'https://ghiblistyleimagegenerator.cc',
        'referer': 'https://ghiblistyleimagegenerator.cc/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const isValidImageUrl = (imgUrl) => {
        try {
            if (!isValidUrl(imgUrl)) return false;
            const ext = ['jpg', 'jpeg', 'png', 'webp'];
            const urlObject = new URL(imgUrl);
            const pathname = urlObject.pathname;
            const extension = pathname.split('.').pop().toLowerCase();
            return ext.includes(extension);
        } catch {
            return false;
        }
    };

    const imageUrlToBase64 = async (imgUrl) => {
        const response = await axios.get(imgUrl, {
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data, 'binary').toString('base64');
    };

    try {
        const imageUrl = req.query.url;

        if (!imageUrl) {
            return res.errorJson({ error: "Parameter 'url' is required." }, 400);
        }

        if (!isValidImageUrl(imageUrl)) {
            return res.errorJson({ error: "Invalid image URL or unsupported file type (jpg, jpeg, png, webp only)." }, 400);
        }

        const base64Image = await imageUrlToBase64(imageUrl);

        const apiResponse = await axios.post(
            `${apiBase}${apiEndpoint}`,
            { image: base64Image },
            { headers: headers }
        );

        if (apiResponse.data && apiResponse.data.success && apiResponse.data.ghibliImage) {
            res.successJson({ result_url: apiResponse.data.ghibliImage });
        } else {
            const errorMessage = apiResponse.data?.message || apiResponse.data?.error || "Failed to generate Ghibli style image from the API.";
            res.errorJson({ error: errorMessage }, 400);
        }

    } catch (error) {
        let statusCode = 500;
        let errorMessage = "An internal server error occurred.";

        if (axios.isAxiosError(error)) {
            if (error.response) {
                statusCode = error.response.status || 500;
                errorMessage = error.response.data?.message || error.response.data?.error || `API request failed with status ${statusCode}`;
            } else if (error.request) {
                statusCode = 503;
                errorMessage = "Could not reach the image generation service.";
                if (error.code === 'ENOTFOUND') {
                    errorMessage = "Could not resolve the image generation service hostname.";
                } else if (error.code === 'ECONNREFUSED') {
                    errorMessage = "Connection refused by the image generation service.";
                } else if (error.message.includes('timeout')) {
                    statusCode = 504;
                    errorMessage = "Request to image generation service timed out.";
                }
            } else {
                errorMessage = `Error setting up request: ${error.message}`;
            }
        } else {
            errorMessage = error.message || "An unexpected error occurred.";
        }

        if (!res.headersSent) {
            res.errorJson({ error: errorMessage }, statusCode);
        }
    }
};
