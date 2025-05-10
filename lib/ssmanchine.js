const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const fs = require('fs/promises');
const path = require('path');
const FormData = require('form-data');

module.exports = async function(req, res) {
    const ssmachine = {
        api: {
            base: "https://www.screenshotmachine.com",
            ocr: "https://www.cardscanner.co",
            catbox: "https://catbox.moe/user/api.php",
            dimensions: {
                desktop: '1024x768',
                phone: '480x800',
                tablet: '800x1280',
                laptop: '1366x768',
                hd: '1920x1080',
                ultrawide: '2560x1080',
                '4k': '3840x2160'
            }
        },
        dom: null,
        window: null,
        document: null,
        cookie: null,
        token: null,
        tokenExpiry: null,
        csrfCookie: null,
        sessionCookie: null,
        headers: {
            'accept': '*/*',
            'accept-language': 'id-MM,id;q=0.9',
            'cache-control': 'no-cache',
            'user-agent': 'Postify/1.0.0'
        },

        initJSDOM: function() {
            this.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
                url: "https://www.screenshotmachine.com",
                referrer: "https://www.screenshotmachine.com",
                contentType: 'text/html',
                includeNodeLocations: true,
                storageQuota: 10000000
            });
            this.window = this.dom.window;
            this.document = this.dom.window.document;
        },

        getDimension: function(device) {
            return this.api.dimensions[device.toLowerCase()] || this.api.dimensions.desktop;
        },

        tokai: async function(forceRefresh = false) {
            try {
                if (!forceRefresh && this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                    return this.token;
                }
                const resToken = await axios.get(this.api.ocr, { headers: this.headers });
                const cookies = resToken.headers['set-cookie'];
                if (cookies) {
                    for (const cookie of cookies) {
                        if (cookie.includes('XSRF-TOKEN=')) {
                            this.csrfCookie = cookie.split(';')[0];
                        }
                        if (cookie.includes('laravel_session=')) {
                            this.sessionCookie = cookie.split(';')[0];
                        }
                    }
                }

                if (!this.csrfCookie || !this.sessionCookie) {
                    throw new Error('Cookie XSRF atau session buat OCR kaga dapet nih.');
                }

                const response = await axios.get(`${this.api.ocr}/image-to-text`, {
                    headers: {
                        ...this.headers,
                        'Cookie': `${this.csrfCookie}; ${this.sessionCookie}`
                    }
                });
                const $ = cheerio.load(response.data);
                const tokenVal = $('input[name="_token"]').val();
                if (!tokenVal) {
                    throw new Error('Token OCR-nya kagak ada bree 🤫');
                }
                this.token = tokenVal;
                this.tokenExpiry = Date.now() + (4 * 60 * 1000);
                return this.token;
            } catch (error) {
                throw new Error(`Ambil token OCR gagal: ${error.message}`);
            }
        },

        getHeaders: function(type = 'json') {
            const currentHeaders = {
                ...this.headers,
                'referer': `${this.api.base}/`
            };
            if (this.cookie) {
                currentHeaders.cookie = `${this.cookie}; homepage-tab=screenshot`;
            }
            if (type === 'image') {
                currentHeaders.accept = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
                currentHeaders['sec-fetch-dest'] = 'image';
                currentHeaders['sec-fetch-mode'] = 'no-cors';
            } else {
                currentHeaders.accept = '*/*';
                currentHeaders['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
                currentHeaders['sec-fetch-dest'] = 'empty';
                currentHeaders['sec-fetch-mode'] = 'cors';
            }
            return currentHeaders;
        },

        updateCookie: function(responseHeaders) {
            const cookies = responseHeaders['set-cookie'];
            if (cookies) {
                const phpSession = cookies.find(c => c.startsWith('PHPSESSID='));
                if (phpSession) {
                    this.cookie = phpSession.split(';')[0];
                }
            }
        },
        
        saveCaptcha: async function(buffer) {
            try {
                const downloadDir = path.join(process.cwd(), 'ssmachine_temp_files');
                await fs.mkdir(downloadDir, { recursive: true });
                const filename = `captcha_${Date.now()}.png`;
                const filepath = path.join(downloadDir, filename);
                await fs.writeFile(filepath, buffer);
                return { filepath, filename };
            } catch (error) {
                throw new Error(`Gagal simpan captcha: ${error.message}`);
            }
        },

        upload2Catbox: async function(buffer, filename) {
            try {
                const formData = new FormData();
                formData.append('reqtype', 'fileupload');
                formData.append('fileToUpload', buffer, filename);
                const response = await axios.post(this.api.catbox, formData, {
                    headers: formData.getHeaders()
                });
                if (!response.data || typeof response.data !== 'string' || !response.data.startsWith('http')) {
                    throw new Error(`Format balasan Catbox aneh atau bukan URL: ${response.data}`);
                }
                return response.data;
            } catch (error) {
                throw new Error(`Gagal upload ke Catbox: ${error.message}`);
            }
        },

        ocrna: async function(imageBuffer, filename, retryCount = 0) {
            try {
                const ocrToken = await this.tokai(retryCount > 0);
                const formData = new FormData();
                formData.append('_token', ocrToken);
                formData.append('imgsData', '');
                formData.append('captcha_token', '');
                formData.append('urlLabel', ''); 
                formData.append('urlLabel', ''); 
                formData.append('images[]', '');
                formData.append('images[]', imageBuffer, filename);
                formData.append('name', `cardscanner.co_${filename}`);
                formData.append('tool', 'image-to-text');

                const up = await axios.post(`${this.api.ocr}/uploadImage`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Cookie': `${this.csrfCookie}; ${this.sessionCookie}`,
                        'Origin': this.api.ocr,
                        'Referer': `${this.api.ocr}/image-to-text`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!up.data || !up.data.path) {
                    throw new Error('Gagal upload gambar captcha buat OCR.');
                }

                const read = await axios.post(`${this.api.ocr}/imageread`, new URLSearchParams({
                    'imgsData': up.data.path,
                    'zipName': 'm8e1vfqswixt1',
                    '_token': ocrToken,
                    'tool': 'image-to-text'
                }).toString(), {
                    headers: {
                        ...this.headers,
                        'Cookie': `${this.csrfCookie}; ${this.sessionCookie}`,
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Origin': this.api.ocr,
                        'Referer': `${this.api.ocr}/image-to-text`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                if (!read.data || typeof read.data.text === 'undefined') {
                     throw new Error('OCR kaga ngasih hasil teks.');
                }
                return read.data.text.trim();
            } catch (error) {
                if (error.response?.status === 419 && retryCount < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.ocrna(imageBuffer, filename, retryCount + 1);
                }
                throw new Error(`Proses OCR gagal: ${error.message}`);
            }
        },

        getCaptcha: async function() {
            let tempFilepath; 
            try {
                const agak = await axios.get(this.api.base, { headers: this.getHeaders() });
                this.updateCookie(agak.headers);

                const captchaImageResponse = await axios.get(`${this.api.base}/simple-php-captcha.php?_CAPTCHA&t=${Date.now()}`, {
                    headers: { ...this.getHeaders('image'), 'x-requested-with': 'XMLHttpRequest' },
                    responseType: 'arraybuffer'
                });
                this.updateCookie(captchaImageResponse.headers);
                
                const captchaBuffer = captchaImageResponse.data;
                if (!captchaBuffer || captchaBuffer.byteLength === 0) {
                    throw new Error("Gambar captcha kosong melompong.");
                }
                
                const { filepath, filename } = await this.saveCaptcha(captchaBuffer);
                tempFilepath = filepath;

                const recognizedText = await this.ocrna(captchaBuffer, filename); 

                if (!recognizedText || recognizedText.trim() === "") {
                    throw new Error("Captcha-nya kaga kebaca atau OCR gagal, coba lagi dah.");
                }
                return { success: true, text: recognizedText };
            } catch (error) {
                return { success: false, error: `Dapetin/proses captcha error parah: ${error.message}` };
            } finally {
                if (tempFilepath) {
                    try {
                        await fs.unlink(tempFilepath);
                    } catch (delError) {
                        console.error(`Gagal hapus file captcha sementara (${tempFilepath}): ${delError.message}`);
                    }
                }
            }
        },

        capture: async function(url, options = {}) {
            try {
                if (!url || typeof url !== 'string' || url.trim() === '') {
                    return { status: false, code: 400, result: { error: "Lu mau ngess web kan? link webnya mana? Gitu doang kudu di kasih tau mulu... " } };
                }
                try {
                    new URL(url);
                } catch (e) {
                    return { status: false, code: 400, result: { error: "Yaelah, URL apaan tuh? Gak valid gitu. 🗿 chuaaak..." } };
                }

                const validDevices = Object.keys(this.api.dimensions);
                const device = (options.device || 'desktop').toLowerCase();
                if (!validDevices.includes(device)) {
                    return { status: false, code: 400, result: { error: "Type Devicenya kagak valid bree, input yang pasti2 dah 🗿", valid_devices: validDevices } };
                }
                
                const dimension = options.dimension || this.getDimension(device); 
                
                const def = {
                    device: device,
                    dimension: dimension,
                    format: 'png',
                    cacheLimit: 0,
                    delay: 200,
                    timeout: 20000
                };
                const settings = { ...def, ...options, dimension };

                const caper = await this.getCaptcha();
                if (!caper.success) {
                    return { status: false, code: 400, result: { error: caper.error || "Gagal dapetin captcha, amsyong dah." } };
                }

                const formData = new URLSearchParams();
                formData.append('url', url);
                formData.append('device', settings.device);
                formData.append('dimension', settings.dimension);
                formData.append('format', settings.format);
                formData.append('cacheLimit', String(settings.cacheLimit));
                formData.append('delay', String(settings.delay));
                formData.append('timeout', String(settings.timeout));
                formData.append('captcha', caper.text);

                const response = await axios.post(`${this.api.base}/capture.php`, formData.toString(), {
                    headers: { ...this.getHeaders(), 'x-requested-with': 'XMLHttpRequest', 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' }
                });

                if (response.data && response.data.status === 'success') {
                    const imageUrl = `${this.api.base}/serve.php?file=result&t=${Date.now()}`;
                    const imageResponse = await axios.get(imageUrl, {
                        headers: this.getHeaders('image'),
                        responseType: 'arraybuffer'
                    });
                    
                    if (!imageResponse.data || imageResponse.data.byteLength === 0) {
                        throw new Error("Hasil screenshotnya kosong, aneh banget.");
                    }

                    const screenshotFilename = `ss_${settings.device}_${Date.now()}.${settings.format}`;
                    const catboxUrl = await this.upload2Catbox(imageResponse.data, screenshotFilename);
                    
                    return {
                        status: true,
                        code: 200,
                        result: {
                            url: catboxUrl,
                            device: settings.device,
                            dimension: settings.dimension,
                            format: settings.format
                        }
                    };
                }
                return { status: false, code: 400, result: { error: response.data.message || 'Screenshotnya gagal bree 🤣, mungkin captchanya salah.' } };
            } catch (error) {
                return { status: false, code: error.response?.status || 500, result: { error: `Error pas capture: ${error.message}` } };
            }
        }
    };

    ssmachine.initJSDOM();

    try {
        const url = req.query.url;
        const queryOptions = {
            device: req.query.device,
            dimension: req.query.dimension,
            format: req.query.format,
            cacheLimit: req.query.cacheLimit !== undefined ? parseInt(req.query.cacheLimit, 10) : undefined,
            delay: req.query.delay !== undefined ? parseInt(req.query.delay, 10) : undefined,
            timeout: req.query.timeout !== undefined ? parseInt(req.query.timeout, 10) : undefined
        };
        
        const cleanOptions = Object.fromEntries(Object.entries(queryOptions).filter(([k, v]) => v !== undefined && !(typeof v === 'number' && isNaN(v))));

        if (!url) {
            return res.errorJson("URL mana bro? Mau SS apa lu?", 400);
        }
        
        const result = await ssmachine.capture(url, cleanOptions);

        if (result.status) {
            res.json(result);
        } else {
            const message = result.result?.error || "Entah kenapa, gagal aja gitu.";
            const statusCode = result.code || 500;
            res.errorJson(message, statusCode);
        }

    } catch (e) {
        console.error("Kesalahan Internal Server:", e.stack || e);
        let errorMessage = "Servernya lagi mabok nih, coba bentar lagi.";
        if (e.message && typeof e.message === 'string') {
             errorMessage = e.message;
        }
        
        let errorStatus = 500;
        if (e.isAxiosError && e.response) {
            errorStatus = e.response.status;
            if (e.response.data) {
                if (typeof e.response.data === 'string' && e.response.data.length < 200) errorMessage = e.response.data;
                else if (e.response.data.message) errorMessage = e.response.data.message;
                else if (e.response.data.error) errorMessage = e.response.data.error;
            }
        }
        res.errorJson(errorMessage, errorStatus);
    }
};