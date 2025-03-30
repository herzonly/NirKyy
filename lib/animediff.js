const axios = require('axios'); const jsdom = require('jsdom'); const { JSDOM } = jsdom;

module.exports = async (req, res) => { try { const { prompt } = req.query; if (!prompt) return res.status(400).send('Prompt is required');

const { data } = await axios.get('https://nuelink.com/tools/ai-image-generator', {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.40 Mobile Safari/537.36',
            'Referer': 'https://nuelink.com/tools/ai-image-generator'
        }
    });

    const dom = new JSDOM(data);
    const scriptContent = [...dom.window.document.querySelectorAll('script')]
        .map(script => script.textContent)
        .find(content => content.includes('var xak ='));

    const apiKeyMatch = scriptContent.match(/var xak = "(.*?)";/);
    if (!apiKeyMatch) return res.status(500).send('API key not found');
    
    const apiKey = apiKeyMatch[1];

    const response = await axios.post(`https://tools.nuelink.com/api/ai/assist?action=IMAGE&prompt=${encodeURIComponent(prompt)}`, 
        { action: 'TTI', prompt },
        {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.40 Mobile Safari/537.36',
                'Referer': 'https://nuelink.com/tools/ai-image-generator'
            },
            responseType: 'arraybuffer'
        }
    );

    res.setHeader('Content-Type', 'image/png');
    res.send(response.data);
} catch (error) {
    res.status(500).send(error.message);
}

};