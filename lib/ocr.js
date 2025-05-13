const axios = require('axios')
const FormData = require('form-data')

module.exports = async function(req, res) {
  try {
    const imageUrl = req.query.url

    if (!imageUrl) {
      return res.errorJson('Mana nih URL gambarnya, bro?', 400)
    }

    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(imageResponse.data)

    const form = new FormData()
    form.append('file', imageBuffer, { filename: 'image.jpg' })
    form.append('language', 'eng')
    form.append('isOverlayRequired', 'true')
    form.append('FileType', '.Auto')
    form.append('IsCreateSearchablePDF', 'false')
    form.append('isSearchablePdfHideTextLayer', 'true')
    form.append('detectOrientation', 'false')
    form.append('isTable', 'false')
    form.append('scale', 'true')
    form.append('OCREngine', '1')
    form.append('detectCheckbox', 'false')
    form.append('checkboxTemplate', '0')

    const ocrResponse = await axios.post('https://api8.ocr.space/parse/image', form, {
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'apikey': 'donotstealthiskey_ip1',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://ocr.space/'
      }
    })

    const ocrData = ocrResponse.data

    if (ocrData.OCRExitCode === 1 && !ocrData.IsErroredOnProcessing && ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
      const parsedResult = ocrData.ParsedResults[0]
      const text = parsedResult.ParsedText.trim()
      const detail = []

      if (parsedResult.TextOverlay && parsedResult.TextOverlay.Lines) {
        parsedResult.TextOverlay.Lines.forEach(line => {
          if (line.Words && line.Words.length > 0) {
            let minLeft = Infinity
            let maxRight = 0
            line.Words.forEach(word => {
              minLeft = Math.min(minLeft, word.Left)
              maxRight = Math.max(maxRight, word.Left + word.Width)
            })

            detail.push({
              lineText: line.LineText,
              top: line.MinTop,
              height: line.MaxHeight,
              left: minLeft,
              width: maxRight - minLeft
            })
          }
        })
      }

      res.successJson({ text, detail })
    } else {
      res.errorJson('API OCR-nya lagi ngadat nih, coba lagi ya.', 500)
    }

  } catch (e) {
    console.error(e)
    res.errorJson('Waduh, ada error nih pas scraping. Cek lagi deh.', 500)
  }
}