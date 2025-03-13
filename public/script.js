document.addEventListener('DOMContentLoaded', function() {
    const endpointData = [
        {
            "nama": "SaveTube",
            "tag": "Downloader",
            "endpoint": "/api/v1/savetube",
            "parameter": [
                {
                    "params": "url",
                    "example": "https://youtu.be/3eDgG_AvOZk?si=HJ1GvDr8o1dNUKcB",
                    "opsional": false
                },
                {
                    "params": "format",
                    "example": "choose: 144, 240, 360, 480, 720, 1080, mp3",
                    "opsional": false
                }
            ]
        },
        {
            "nama": "Jadwal Anime",
            "tag": "Tools",
            "endpoint": "/api/v1/anime-jadwal",
            "parameter": [
                {
                    "params": "hari",
                    "example": "senin / Monday",
                    "opsional": false
                }
            ]
        },
        {
            "nama": "Pinterest",
            "tag": "Search",
            "endpoint": "/api/v1/pin",
            "parameter": [
                {
                    "params": "query",
                    "example": "Boboiboy",
                    "opsional": false
                }
            ]
        },
        {
            "nama": "Groq Chat 3000 Token History",
            "tag": "AI",
            "endpoint": "/api/v1/llm",
            "parameter": [
                {
                    "params": "groqKey",
                    "example": null,
                    "opsional": false
                },
                {
                    "params": "model",
                    "example": "gemma2-9b-it",
                    "opsional": true
                },
                {
                    "params": "user",
                    "example": "Ricky",
                    "opsional": false
                },
                {
                    "params": "systemPrompt",
                    "example": "kamu adalah Nirsky...",
                    "opsional": true
                },
                {
                    "params": "msg",
                    "example": "hallo apa kabar",
                    "opsional": false
                }
            ]
        },
        {
            "nama": "AIO downloader",
            "tag": "Downloader",
            "endpoint": "/api/v1/aio-dl",
            "parameter": [
                {
                    "params": "url",
                    "example": "https://www.instagram.com/reel/DG7I2Ezz2sy/?igsh=MTFoN2Z1MDJpeGNj",
                    "opsional": false
                }
            ]
        }
    ];

    const endpointListSection = document.getElementById('endpointList');
    const searchEndpointInput = document.getElementById('searchEndpoint');
    const tryModal = document.getElementById('tryModal');
    const closeButton = document.querySelector('.close-button');
    const parameterInputsDiv = document.getElementById('parameterInputs');
    const runButton = document.getElementById('runButton');
    const responseContentDiv = document.getElementById('responseContent');
    const copyResponseButton = document.getElementById('copyResponseButton');
    const copyEndpointButton = document.getElementById('copyEndpointButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const successSound = document.getElementById('successSound');
    const errorSound = document.getElementById('errorSound');

    function renderEndpointList(endpoints) {
        endpointListSection.innerHTML = '';
        endpoints.sort((a, b) => {
            const tagA = a.tag.toUpperCase();
            const tagB = b.tag.toUpperCase();
            const namaA = a.nama.toUpperCase();
            const namaB = b.nama.toUpperCase();
            if (tagA < tagB) {
                return -1;
            }
            if (tagA > tagB) {
                return 1;
            }
            if (namaA < namaB) {
                return -1;
            }
            if (namaA > namaB) {
                return 1;
            }
            return 0;
        });
        endpoints.forEach(endpoint => {
            const card = document.createElement('div');
            card.classList.add('endpoint-card');
            card.innerHTML = `
                <h3>${endpoint.nama}</h3>
                <span class="tag">${endpoint.tag}</span>
                <div class="endpoint-url">${endpoint.endpoint}</div>
                <div class="button-container">
                    <button class="copy-url-button" data-url="${endpoint.endpoint}">Copy URL</button>
                    <button class="try-button" data-endpoint='${JSON.stringify(endpoint)}'>Try</button>
                </div>
            `;
            endpointListSection.appendChild(card);
        });
        attachButtonEventListeners();
    }

    function attachButtonEventListeners() {
        document.querySelectorAll('.copy-url-button').forEach(button => {
            button.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    alert('URL berhasil di-copy!');
                }).catch(err => {
                    console.error('Gagal copy URL: ', err);
                    alert('Gagal copy URL.');
                });
            });
        });
        document.querySelectorAll('.try-button').forEach(button => {
            button.addEventListener('click', function() {
                const endpointData = JSON.parse(this.getAttribute('data-endpoint'));
                openTryModal(endpointData);
            });
        });
    }

    function openTryModal(endpoint) {
        parameterInputsDiv.innerHTML = '';
        currentEndpointData = endpoint;
        responseContentDiv.innerHTML = '';
        responseContentDiv.className = '';
        if (endpoint.parameter && endpoint.parameter.length > 0) {
            endpoint.parameter.forEach(param => {
                const paramName = param.params;
                const defaultValue = param.example;
                const required = param.opsional === false;
                const label = document.createElement('label');
                label.textContent = `${paramName} ${required ? '(Wajib)' : '(Opsional)'}:`;
                const input = document.createElement('input');
                input.type = 'text';
                input.name = paramName;
                input.placeholder = defaultValue !== null ? `Default: ${defaultValue}` : `Masukkan ${paramName}`;
                input.value = defaultValue !== null ? defaultValue : '';
                input.required = required;
                parameterInputsDiv.appendChild(label);
                parameterInputsDiv.appendChild(input);
            });
        }
        tryModal.style.display = "block";
    }

    closeButton.onclick = function() {
        tryModal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target == tryModal) {
            tryModal.style.display = "none";
        }
    };

    runButton.onclick = function() {
        runApiRequest();
    };

    copyResponseButton.onclick = function() {
        copyApiResponse();
    };

    copyEndpointButton.onclick = function() {
        copyApiEndpoint();
    };

    let currentEndpointData;
    let finalApiUrl;

    function runApiRequest() {
        if (!currentEndpointData) return;
        let apiUrl = currentEndpointData.endpoint;
        let params = {};
        let hasRequiredParams = false;
        if (currentEndpointData.parameter && currentEndpointData.parameter.length > 0) {
            parameterInputsDiv.querySelectorAll('input').forEach(input => {
                const paramName = input.name;
                const paramDef = currentEndpointData.parameter.find(p => p.params === paramName);
                const required = paramDef.example === null;
                const defaultValue = paramDef.example !== null ? paramDef.example : '';
                if (input.value) {
                    params[paramName] = input.value;
                } else if (!required && defaultValue !== '') {
                    params[paramName] = defaultValue;
                } else if (required && !input.value) {
                    hasRequiredParams = true;
                }
            });
        }
        if (hasRequiredParams) {
            alert('Harap isi semua parameter wajib.');
            return;
        }
        Object.keys(params).forEach(paramName => {
            const urlParamPlaceholder = `{${paramName}}`;
            if (apiUrl.includes(urlParamPlaceholder)) {
                apiUrl = apiUrl.replace(urlParamPlaceholder, params[paramName]);
                delete params[paramName];
            }
        });
        const queryParams = new URLSearchParams(params);
        finalApiUrl = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl;
        loadingIndicator.style.display = 'block';
        responseContentDiv.innerHTML = '';
        responseContentDiv.className = '';
        return fetch(finalApiUrl)
            .then(response => {
                loadingIndicator.style.display = 'none';
                if (!response.ok) {
                    errorSound.play();
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response;
            })
            .then(response => {
                successSound.play();
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    responseContentDiv.className = 'json-response';
                    return response.json();
                } else if (contentType && contentType.startsWith('image/')) {
                    return Promise.resolve({ type: 'image', url: response.url });
                } else if (contentType && contentType.startsWith('video/')) {
                    return Promise.resolve({ type: 'video', url: response.url });
                } else {
                    return response.text();
                }
            })
            .then(data => {
                if (typeof data === 'object' && data !== null && data.type === 'image') {
                    const img = document.createElement('img');
                    img.src = data.url;
                    responseContentDiv.appendChild(img);
                } else if (typeof data === 'object' && data !== null && data.type === 'video') {
                    const video = document.createElement('video');
                    video.src = data.url;
                    video.controls = true;
                    responseContentDiv.appendChild(video);
                } else if (typeof data === 'object') {
                    responseContentDiv.textContent = JSON.stringify(data, null, 2);
                } else {
                    responseContentDiv.textContent = data;
                }
            })
            .catch(error => {
                loadingIndicator.style.display = 'none';
                responseContentDiv.textContent = `Error: ${error.message}`;
                errorSound.play();
            });
    }

    function copyApiResponse() {
        const responseText = responseContentDiv.textContent;
        navigator.clipboard.writeText(responseText).then(() => {
            alert('Response API berhasil di-copy!');
        }).catch(err => {
            console.error('Gagal copy response API: ', err);
            alert('Gagal copy response API.');
        });
    }

    function copyApiEndpoint() {
        if (finalApiUrl) {
            navigator.clipboard.writeText(finalApiUrl).then(() => {
                alert('Endpoint berhasil di-copy!');
            }).catch(err => {
                console.error('Gagal copy endpoint: ', err);
                alert('Gagal copy endpoint.');
            });
        } else {
            alert('Tidak ada endpoint yang dapat di-copy. Jalankan "Try" terlebih dahulu.');
        }
    }

    searchEndpointInput.addEventListener('input', function() {
        const searchTerm = searchEndpointInput.value.toLowerCase();
        const filteredEndpoints = endpointData.filter(endpoint => {
            return endpoint.nama.toLowerCase().includes(searchTerm) || endpoint.tag.toLowerCase().includes(searchTerm) || endpoint.endpoint.toLowerCase().includes(searchTerm);
        });
        renderEndpointList(filteredEndpoints);
    });

    renderEndpointList(endpointData);
});