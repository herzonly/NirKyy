document.addEventListener('DOMContentLoaded', function() {
    const endpointData = [
        {
            "nama": "AIO downloader",
            "tag": "Downloader",
            "endpoint": "/api/v1/aio-dl",
            "parameter": [{"url": null}]
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

        // Event listeners untuk tombol setelah render
        attachButtonEventListeners();
    }

    function attachButtonEventListeners() {
        // Copy URL buttons
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

        // Try buttons
        document.querySelectorAll('.try-button').forEach(button => {
            button.addEventListener('click', function() {
                const endpointData = JSON.parse(this.getAttribute('data-endpoint'));
                openTryModal(endpointData);
            });
        });
    }

    function openTryModal(endpoint) {
        parameterInputsDiv.innerHTML = ''; // Bersihkan input parameter sebelumnya
        currentEndpointData = endpoint; // Simpan data endpoint saat ini
        responseContentDiv.innerHTML = ''; // Bersihkan response content sebelumnya
        responseContentDiv.className = ''; // Reset class response content

        if (endpoint.parameter && endpoint.parameter.length > 0) {
            endpoint.parameter.forEach(param => {
                for (const paramName in param) {
                    const isRequired = param[paramName] === null;
                    const label = document.createElement('label');
                    label.textContent = `${paramName} ${isRequired ? '(Wajib)' : '(Opsional)'}:`;
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.name = paramName;
                    input.placeholder = param[paramName] !== null ? param[paramName] : `Masukkan ${paramName}`;
                    input.required = isRequired;
                    parameterInputsDiv.appendChild(label);
                    parameterInputsDiv.appendChild(input);
                }
            });
        }

        tryModal.style.display = "block";
    }

    closeButton.onclick = function() {
        tryModal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == tryModal) {
            tryModal.style.display = "none";
        }
    }

    runButton.onclick = function() {
        runApiRequest();
    };

    copyResponseButton.onclick = function() {
        copyApiResponse();
    };

    copyEndpointButton.onclick = function() {
        copyApiEndpoint();
    };

    let currentEndpointData; // Untuk menyimpan data endpoint yang sedang di "try"
    let finalApiUrl; // Untuk menyimpan final API URL setelah parameter diisi

    function runApiRequest() {
        if (!currentEndpointData) return;

        let apiUrl = currentEndpointData.endpoint;
        let params = {};
        let hasRequiredParams = false;

        if (currentEndpointData.parameter && currentEndpointData.parameter.length > 0) {
            parameterInputsDiv.querySelectorAll('input').forEach(input => {
                if (input.value) {
                    const paramName = input.name;
                    params[paramName] = input.value;
                } else if (input.required) {
                    hasRequiredParams = true;
                }
            });
        }

        if (hasRequiredParams) {
            alert('Harap isi semua parameter wajib.');
            return;
        }

        // Ganti parameter URL jika ada di endpoint (misalnya /users/{userId})
        Object.keys(params).forEach(paramName => {
            const urlParamPlaceholder = `{${paramName}}`;
            if (apiUrl.includes(urlParamPlaceholder)) {
                apiUrl = apiUrl.replace(urlParamPlaceholder, params[paramName]);
                delete params[paramName]; // Hapus dari params query karena sudah di URL
            }
        });

        // Tambahkan query parameters jika ada yang tersisa
        const queryParams = new URLSearchParams(params);
        finalApiUrl = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl;


        loadingIndicator.style.display = 'block'; // Tampilkan loading indicator
        responseContentDiv.innerHTML = ''; // Bersihkan konten response sebelumnya
        responseContentDiv.className = ''; // Reset class response content

        return fetch(finalApiUrl) // Tambahkan return di sini untuk promise chaining yang benar
            .then(response => {
                loadingIndicator.style.display = 'none'; // Sembunyikan loading indicator
                if (!response.ok) {
                    errorSound.play(); // Putar sound error jika request gagal
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response; // Kembalikan response di sini
            })
            .then(response => { // Blok .then kedua untuk penanganan response sukses
                successSound.play(); // Putar sound success jika request berhasil - DIPINDAHKAN KE SINI
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    responseContentDiv.className = 'json-response'; // Tambahkan class untuk JSON
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
                }
                else {
                    responseContentDiv.textContent = data;
                }
            })
            .catch(error => {
                loadingIndicator.style.display = 'none'; // Pastikan loading indicator sembunyi saat error
                responseContentDiv.textContent = `Error: ${error.message}`;
                errorSound.play(); // Pastikan sound error juga diputar saat error di catch
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


    // Search functionality
    searchEndpointInput.addEventListener('input', function() {
        const searchTerm = searchEndpointInput.value.toLowerCase();
        const filteredEndpoints = endpointData.filter(endpoint => {
            return endpoint.nama.toLowerCase().includes(searchTerm) || endpoint.tag.toLowerCase().includes(searchTerm) || endpoint.endpoint.toLowerCase().includes(searchTerm);
        });
        renderEndpointList(filteredEndpoints);
    });


    // Initial render
    renderEndpointList(endpointData);
});
