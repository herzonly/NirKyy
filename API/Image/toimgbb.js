const axios = require('axios')

async function imgBB(buffer) {
	return new Promise (async (resolve, reject) => {
		try {
			const base64Image = buffer.toString('base64');
			const apiKey = '9e4671c6ee232da278ad037fe8a23ae8';

			const formData = `key=${apiKey}&image=${encodeURIComponent(base64Image)}`;

			const response = await axios.post(
				`https://api.imgbb.com/1/upload`,
				formData,
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);

			if (response.data && response.data.data && response.data.data.url) {
				resolve(response.data.data.url);
			} else {
				reject(new Error('Upload failed or response format is incorrect'));
			}
		} catch (error) {
			reject(error);
		}
	});
}


module.exports = async function(req, res) {
  try {
    let imageBuffer = null;

    if (req.query.imgurl) {
      try {
        const response = await axios.get(req.query.imgurl, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data);
      } catch (urlError) {
        return res.errorJson('Gagal ngambil gambar dari URL, cek lagi deh URL-nya!', 400);
      }
    } else if (req.body.file && req.body.file.data) {
       if (Buffer.isBuffer(req.body.file.data)) {
           imageBuffer = req.body.file.data;
       } else if (Array.isArray(req.body.file.data)) {
           imageBuffer = Buffer.from(req.body.file.data);
       } else {
           return res.errorJson('Format file di body gak bener nih!', 400);
       }
    } else {
      return res.errorJson('Mana nih gambarnya? Kirim via imgurl atau file di body!', 400);
    }

    if (!imageBuffer) {
         return res.errorJson('Gagal dapetin buffer gambar, coba lagi ya!', 500);
    }

    const imageUrl = await imgBB(imageBuffer);

    res.successJson({ url: imageUrl });

  } catch (e) {
    res.errorJson('Ada yang error nih pas upload gambar, coba cek lagi!', 500);
  }
}