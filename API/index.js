const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { handleTextQuery } = require('../lib/ai.js');
const { pin } = require('../lib/pinterest.js');
const { jadwal } = require('../lib/animeJadwal.js');
const crypto = require('crypto');
const alicia = require('../lib/alicia.js');
const gq = require('../lib/genrateQuery.js');
const snapsave = require('../lib/snapsave.js')
const speechma = require('../lib/speechma.js')
const imagine = require('../lib/imagine.js')
const gemini = require('../lib/toolbaz.js')
const luminai = require('../lib/luminai.js')
const rmbg = require('../lib/removebg.js')
const nulis = require('../lib/nulis.js')
const upscale = require('../lib/upscale.js')
const chatgpt = require('../lib/chatgpt.js')
const translate = require('../lib/translate.js');
const yanzGPT = require('../lib/yanzGPT.js')
const spotify = require('../lib/spotify.js')
const tiktokScrapt = require('../lib/tiktok.js')
const ghiblistyle = require('../lib/ghiblistyle.js')
const fancyText = require('../lib/fancyText.js')
const ngl = require('../lib/ngl.js')
const youtubeSearch = require('../lib/youtubeSearch.js')
const playyt = require('../lib/play.js')
const ttsindo = require('../lib/ttsindo.js')
const allvid = require('../lib/alvid.js')
const googleSearch = require('../lib/googleSearch.js')
const fluxf = require('../lib/fluxFast.js')
const ytaudiov2 = require('../lib/ytAudioV2.js')
const komiku = require('../lib/komiku.js')
//-
router.get('/tictactoe',require('../lib/tictactoe.js'))
router.get('/image-random',require('../lib/image-random.js'))
router.get('/komik',komiku)
router.get('/youtube-audio-v2',ytaudiov2)
router.get('/otakudesu', require('../lib/otakudesu.js'))
router.get('/fluxfast', fluxf)
router.get('/yahoo-search', googleSearch)
router.get('/allvid', allvid);
router.get('/text2speech-indo', ttsindo)
router.get('/ytplay-mp3', playyt)
router.get('/youtube-search', youtubeSearch)
router.get('/sendngl', ngl)
router.get('/fancytext', fancyText)
router.get('/ghiblistyle', ghiblistyle)
router.get('/tiktokdl', tiktokScrapt)
router.get('/spotifydl', spotify);
router.get('/yanzgpt', yanzGPT);
router.get('/gemini-translate', translate)
router.get('/gpt-4o-latest', chatgpt)
router.get('/upscale', upscale)
router.get('/nulis', nulis)
router.get('/removebg', rmbg)
router.get('/luminai', luminai)
router.get('/gemini',gemini)

router.get('/facebook-dl', async (req,res) => {
    try {
    const videoUrl = req.query.url
    
    if (!videoUrl) {
      return res.errorJson('Woi, link videonya mana? Gak ada link, gak bisa kerja gue!', 400)
    }
    
    const mainPageUrl = 'https://fdownloader.net/id'
    const mainPageResponse = await axios.get(mainPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://fdownloader.net/id'
      }
    })
    const mainPageHtml = mainPageResponse.data
    
    const kExpMatch = mainPageHtml.match(/k_exp="([^"]+)"/)
    const kTokenMatch = mainPageHtml.match(/k_token="([^"]+)"/)
    const cTokenMatch = mainPageHtml.match(/c_token="([^"]+)"/)
    
    if (!kExpMatch || !kTokenMatch || !cTokenMatch) {
      return res.errorJson('Gagal dapetin kunci rahasia dari website sumber, coba lagi nanti!', 500)
    }
    
    const k_exp = kExpMatch[1]
    const k_token = kTokenMatch[1]
    const c_token = cTokenMatch[1]
    
    const ajaxSearchUrl = 'https://v3.fdownloader.net/api/ajaxSearch'
    const postData = new URLSearchParams({
      k_exp: k_exp,
      k_token: k_token,
      q: videoUrl,
      lang: 'id',
      web: 'fdownloader.net',
      v: 'v2',
      w: '',
      cftoken: c_token
    }).toString()
    
    const ajaxResponse = await axios.post(ajaxSearchUrl, postData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://fdownloader.net/id'
      }
    })
    
    const responseData = ajaxResponse.data
    
    if (responseData.status !== 'ok' || !responseData.data) {
      return res.errorJson('Respons dari server target aneh, gak ngasih data yang jelas!', 500)
    }
    
    const $ = cheerio.load(responseData.data)
    const downloadLinks = []
    const thumbnail = $('.thumbnail img').attr('src')
    
    $('table.table tbody tr').each((i, el) => {
      const quality = $(el).find('td.video-quality').text().trim()
      const directLink = $(el).find('a.download-link-fb').attr('href')
      const renderButton = $(el).find('button')
      
      let url = null
      let type = 'unknown'
      
      if (directLink) {
        url = directLink
        type = 'direct'
      } else if (renderButton.length > 0) {
        const renderUrl = renderButton.attr('data-videourl')
        if (renderUrl) {
          url = renderUrl
          type = 'render_needed'
        }
      }
      
      if (quality && url) {
        downloadLinks.push({
          quality: quality,
          url: url,
          type: type
        })
      }
    })
    
    if (downloadLinks.length === 0) {
      return res.errorJson('Astaga, gak nemu link download sama sekali! Mungkin link lu salah atau videonya gak bisa diunduh.', 404)
    }
    
    res.successJson({ thumbnail, links: downloadLinks })
    
  } catch (e) {
    res.errorJson('Waduh, server lagi ngadat nih! Ada error internal, coba lagi nanti ya.', 500)
  }
})

router.get('/ssweb', async (req,res) => {
  try {
  const {
    url,
    browserWidth,
    browserHeight,
    fullPage,
    deviceScaleFactor,
    format
  } = req.query
  
  if (!url) {
    return res.errorJson('Parameter "url" wajib diisi, bego!', 400)
  }
  
  const screenshotPayload = {
    url: url,
    browserWidth: browserWidth ? parseInt(browserWidth, 10) : 1280,
    browserHeight: browserHeight ? parseInt(browserHeight, 10) : 720,
    fullPage: fullPage ? fullPage === 'true' : false,
    deviceScaleFactor: deviceScaleFactor ? parseFloat(deviceScaleFactor) : 1,
    format: format || 'png'
  }
  
  const screenshotApiUrl = 'https://gcp.imagy.app/screenshot/createscreenshot'
  const screenshotResponse = await axios.post(screenshotApiUrl, screenshotPayload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
      'Referer': 'https://imagy.app/full-page-screenshot-taker/'
    }
  })
  
  const fileUrl = screenshotResponse.data.fileUrl
  
  if (!fileUrl) {
    return res.errorJson('API screenshot-nya pelit, gak ngasih URL file. Brengsek!', 500)
  }
  
  const imageResponse = await axios.get(fileUrl, {
    responseType: 'stream'
  })
  
  const contentType = imageResponse.headers['content-type']
  if (contentType) {
    res.setHeader('Content-Type', contentType)
  } else {
    res.setHeader('Content-Type', `image/${screenshotPayload.format}`)
  }
  
  imageResponse.data.pipe(res)
  
  imageResponse.data.on('error', (err) => {
    res.errorJson(`Gagal nyedot gambar stream-nya. Ada apa nih?! ${err.message}`, 500)
  })
  
} catch (e) {
  if (!res.headersSent) {
    res.errorJson(`Ada error tolol di prosesnya: ${e.message}`, e.response ? e.response.status : 500)
  } else {
    console.error(`Error setelah headers terkirim: ${e.message}`)
  }
}
});
router.get('/writecream-text2image', async (req,res) => {
  const prompt = req.query.prompt
const aspectRatio = req.query.aspect_ratio || '1:1'
const link = 'writecream.com'

if (!prompt) {
  return res.errorJson('Mana promptnya? Mau bikin gambar apa sih?', 400)
}

const apiUrl = `https://1yjs1yldj7.execute-api.us-east-1.amazonaws.com/default/ai_image?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${encodeURIComponent(aspectRatio)}&link=${encodeURIComponent(link)}`

try {
  const apiResponse = await axios.get(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Mobile Safari/537.36',
      'Referer': apiUrl
    }
  })
  
  const imageLink = apiResponse.data.image_link
  
  if (!imageLink) {
    return res.errorJson('Duh, link gambarnya nggak ada di respons API. Aneh.', 500)
  }
  
  const imageResponse = await axios.get(imageLink, {
    responseType: 'stream'
  })
  
  res.setHeader('Content-Type', 'image/jpeg')
  imageResponse.data.pipe(res)
  
} catch (e) {
  if (e.response && e.response.status) {
    if (e.response.status >= 400 && e.response.status < 500) {
      return res.errorJson(`API-nya protes nih, status: ${e.response.status}. Cek lagi deh prompt atau parameternya.`, e.response.status)
    } else {
      return res.errorJson(`Duh, gagal nyari link gambarnya nih. Server API-nya lagi ngambek kali, status: ${e.response.status}.`, e.response.status)
    }
  } else if (e.request) {
    return res.errorJson('Permintaan ke API-nya nggak nyampe. Koneksi internet lu kali yang jelek?', 500)
  } else {
    return res.errorJson('Ada error aneh pas mau ngambil gambar. Coba lagi aja.', 500)
  }
}
});
router.get('/jadwal-sholat', async (req, res) => {
  const cityMapping = {
    "aceh barat": "317",
    "aceh barat daya": "318",
    "aceh besar": "319",
    "aceh jaya": "320",
    "aceh selatan": "321",
    "aceh singkil": "322",
    "aceh tamiang": "323",
    "aceh tengah": "324",
    "aceh tenggara": "325",
    "aceh timur": "326",
    "aceh utara": "327",
    "agam": "329",
    "alor": "330",
    "ambarawa": "1",
    "ambon": "2",
    "amlapura": "3",
    "amuntai": "4",
    "argamakmur": "5",
    "asahan": "331",
    "asmat": "332",
    "atambua": "6",
    "babo": "7",
    "badung": "333",
    "bagan siapiapi": "8",
    "bahaur, kalteng": "316",
    "bajawa": "9",
    "balangan": "334",
    "balige": "10",
    "balikpapan": "11",
    "banda aceh": "12",
    "bandar lampung": "335",
    "bandarlampung": "13",
    "bandung": "14",
    "bandung barat": "336",
    "banggai": "337",
    "banggai kepulauan": "338",
    "banggai laut": "339",
    "bangka": "340",
    "bangka barat": "341",
    "bangka selatan": "342",
    "bangka tengah": "343",
    "bangkalan": "15",
    "bangkinang": "16",
    "bangko": "17",
    "bangli": "18",
    "banjar": "19",
    "banjar baru": "20",
    "banjarbaru": "344",
    "banjarmasin": "21",
    "banjarnegara": "22",
    "bantaeng": "23",
    "banten": "24",
    "bantul": "25",
    "banyuasin": "345",
    "banyumas": "346",
    "banyuwangi": "26",
    "barabai": "27",
    "barito": "28",
    "barito kuala": "347",
    "barito selatan": "348",
    "barito timur": "349",
    "barito utara": "350",
    "barru": "29",
    "batam": "30",
    "batang": "31",
    "batanghari": "351",
    "batu": "32",
    "batu bara": "352",
    "baturaja": "33",
    "batusangkar": "34",
    "bau bau": "353",
    "baubau": "35",
    "bekasi": "36",
    "belitung": "354",
    "belitung timur": "355",
    "belu": "356",
    "bener meriah": "357",
    "bengkalis": "37",
    "bengkayang": "358",
    "bengkulu": "38",
    "bengkulu selatan": "359",
    "bengkulu tengah": "360",
    "bengkulu utara": "361",
    "benteng": "39",
    "berau": "362",
    "biak": "40",
    "biak numfor": "363",
    "bima": "41",
    "binjai": "42",
    "bintan": "364",
    "bireuen": "43",
    "bitung": "44",
    "blitar": "45",
    "blora": "46",
    "boalemo": "365",
    "bogor": "47",
    "bojonegoro": "48",
    "bolaang mongondow": "366",
    "bolaang mongondow selatan": "367",
    "bolaang mongondow timur": "368",
    "bolaang mongondow utara": "369",
    "bombana": "370",
    "bondowoso": "49",
    "bone": "371",
    "bone bolango": "372",
    "bontang": "50",
    "boven digoel": "373",
    "boyolali": "51",
    "brebes": "52",
    "bukit tinggi": "53",
    "bukittinggi": "374",
    "bula sbt, maluku": "315",
    "buleleng": "375",
    "bulukumba": "54",
    "bulungan": "376",
    "bungo": "377",
    "buntok": "55",
    "buol": "378",
    "buru": "379",
    "buru selatan": "380",
    "buton": "381",
    "buton selatan": "382",
    "buton tengah": "383",
    "buton utara": "384",
    "cepu": "56",
    "ciam": "57",
    "cianjur": "58",
    "cibinong": "59",
    "cilacap": "60",
    "cilegon": "61",
    "cimahi": "62",
    "cirebon": "63",
    "curup": "64",
    "dairi": "385",
    "deiyai": "386",
    "deli serdang": "387",
    "demak": "65",
    "denpasar": "66",
    "depok": "67",
    "dharmasraya": "388",
    "dili": "68",
    "dogiyai": "389",
    "dompu": "69",
    "donggala": "70",
    "dumai": "71",
    "empat lawang": "390",
    "ende": "72",
    "enggano": "73",
    "enrekang": "74",
    "fak fak": "391",
    "fakfak": "75",
    "flores timur": "392",
    "garut": "76",
    "gayo lues": "393",
    "gianyar": "77",
    "gombong": "78",
    "gorontalo": "79",
    "gorontalo utara": "394",
    "gowa": "395",
    "gresik": "80",
    "grobogan": "396",
    "gunung mas": "397",
    "gunung sitoli": "81",
    "gunungkidul": "398",
    "gunungsitoli": "399",
    "halmahera barat": "400",
    "halmahera selatan": "401",
    "halmahera tengah": "402",
    "halmahera timur": "403",
    "halmahera utara": "404",
    "hulu sungai selatan": "405",
    "hulu sungai tengah": "406",
    "hulu sungai utara": "407",
    "humbang hasundutan": "408",
    "indragiri hilir": "409",
    "indragiri hulu": "410",
    "indramayu": "82",
    "intan jaya": "411",
    "jakarta barat": "309",
    "jakarta pusat": "308",
    "jakarta selatan": "310",
    "jakarta timur": "311",
    "jakarta utara": "312",
    "jambi": "83",
    "jayapura": "84",
    "jayawijaya": "412",
    "jember": "85",
    "jembrana": "413",
    "jeneponto": "86",
    "jepara": "87",
    "jombang": "88",
    "kab timor tengah selatan": "414",
    "kaimana": "415",
    "kabanjahe": "89",
    "kalabahi": "90",
    "kalianda": "91",
    "kampar": "416",
    "kandangan": "92",
    "karanganyar": "93",
    "karangasem": "419",
    "karawang": "94",
    "karimun": "420",
    "karo": "421",
    "kasungan": "95",
    "katingan": "422",
    "kaur": "423",
    "kayong utara": "424",
    "kayuagung": "96",
    "kebumen": "97",
    "kediri": "98",
    "keerom": "425",
    "kefamenanu": "99",
    "kendal": "100",
    "kendari": "101",
    "kep. seribu": "328",
    "kep. siau tagulandang biaro": "426",
    "kepahiang": "427",
    "kepulauan anambas": "428",
    "kepulauan aru": "429",
    "kepulauan mentawai": "430",
    "kepulauan meranti": "431",
    "kepulauan sangihe": "432",
    "kepulauan selayar": "433",
    "kepulauan sula": "434",
    "kepulauan talaud": "435",
    "kepulauan tanimbar": "436",
    "kepulauan yapen": "437",
    "kerinci": "438",
    "kertosono": "102",
    "ketapang": "103",
    "kisaran": "104",
    "klaten": "105",
    "kolaka": "106",
    "kolaka timur": "440",
    "kolaka utara": "441",
    "konawe": "442",
    "konawe kepulauan": "443",
    "konawe selatan": "444",
    "konawe utara": "445",
    "kota baru pulau laut": "107",
    "kota bumi": "108",
    "kota jantho": "109",
    "kotabaru": "446",
    "kotamobagu": "110",
    "kotawaringin barat": "447",
    "kotawaringin timur": "448",
    "kuala kapuas": "111",
    "kuala kurun": "112",
    "kuala pembuang": "113",
    "kuala tungkal": "114",
    "kuantan singingi": "449",
    "kubu raya": "450",
    "kudus": "115",
    "kulon progo": "451",
    "kuningan": "116",
    "kupang": "117",
    "kutacane": "118",
    "kutai barat": "452",
    "kutai kartanegara": "453",
    "kutai timur": "454",
    "kutoarjo": "119",
    "labuhan": "120",
    "labuhan batu": "455",
    "labuhan batu selatan": "456",
    "labuhan batu utara": "457",
    "lahat": "121",
    "lamandau": "458",
    "lamongan": "122",
    "lampung barat": "459",
    "lampung selatan": "460",
    "lampung tengah": "461",
    "lampung timur": "462",
    "lampung utara": "463",
    "landak": "464",
    "langkat": "465",
    "langsa": "123",
    "lanny jaya": "466",
    "larantuka": "124",
    "lawang": "125",
    "lebak": "467",
    "lebong": "468",
    "lembata": "469",
    "lhokseumawe": "470",
    "lhoseumawe": "126",
    "lima puluh kota": "471",
    "limboto": "127",
    "lingga": "472",
    "lombok barat": "473",
    "lombok tengah": "474",
    "lombok timur": "475",
    "lombok utara": "476",
    "lubuk basung": "128",
    "lubuk linggau": "129",
    "lubuk pakam": "130",
    "lubuk sikaping": "131",
    "lumajang": "132",
    "luwu": "477",
    "luwu timur": "478",
    "luwu utara": "479",
    "luwuk": "133",
    "madiun": "134",
    "magelang": "135",
    "magetan": "136",
    "mahakam ulu": "480",
    "majalengka": "137",
    "majene": "138",
    "makale": "139",
    "makassar": "140",
    "malaka": "481",
    "malang": "141",
    "malinau": "482",
    "maluku barat daya": "483",
    "maluku tengah": "484",
    "maluku tenggara": "485",
    "maluku utara": "486",
    "mamasa": "486",
    "mamberamo raya": "487",
    "mamberamo tengah": "488",
    "mamuju": "142",
    "mamuju tengah": "489",
    "manado": "490",
    "mandailing natal": "491",
    "manggarai": "492",
    "manggarai barat": "493",
    "manggarai timur": "494",
    "manna": "143",
    "manokwari": "144",
    "manokwari selatan": "495",
    "mappi": "496",
    "marabahan": "145",
    "maros": "146",
    "martapura kalsel": "147",
    "masamba, sulsel": "314",
    "masohi": "148",
    "mataram": "149",
    "maumere": "150",
    "maybrat": "497",
    "medan": "151",
    "melawi": "498",
    "mempawah": "152",
    "menado": "153",
    "mentok": "154",
    "merangin": "499",
    "merauke": "155",
    "mesuji": "500",
    "metro": "156",
    "meulaboh": "157",
    "mimika": "501",
    "minahasa": "502",
    "minahasa selatan": "503",
    "minahasa tenggara": "504",
    "minahasa utara": "505",
    "mojokerto": "158",
    "morowali": "506",
    "morowali utara": "507",
    "muara bulian": "159",
    "muara bungo": "160",
    "muara enim": "161",
    "muara teweh": "162",
    "muaro jambi": "508",
    "muaro sijunjung": "163",
    "muko muko": "509",
    "muna": "510",
    "muna barat": "511",
    "muntilan": "164",
    "murung raya": "512",
    "musi banyuasin": "513",
    "musi rawas": "514",
    "musi rawas utara": "515",
    "nabire": "165",
    "nagan raya": "516",
    "nagekeo": "517",
    "natuna": "518",
    "nduga": "519",
    "negara": "166",
    "ngada": "520",
    "nganjuk": "167",
    "ngawi": "168",
    "nias": "521",
    "nias barat": "522",
    "nias selatan": "523",
    "nias utara": "524",
    "nunukan": "169",
    "ogan ilir": "525",
    "ogan komering ilir": "526",
    "ogan komering ulu": "527",
    "ogan komering ulu selatan": "528",
    "ogan komering ulu timur": "529",
    "pacitan": "170",
    "padang": "171",
    "padang lawas": "530",
    "padang lawas utara": "531",
    "padang panjang": "172",
    "padang pariaman": "532",
    "padang sidempuan": "173",
    "padangsidimpuan": "533",
    "pagar alam": "534",
    "pagaralam": "174",
    "pahuwato": "535",
    "painan": "175",
    "pakpak bharat": "536",
    "palangkaraya": "176",
    "palembang": "177",
    "palopo": "178",
    "palu": "179",
    "pamekasan": "180",
    "pandeglang": "181",
    "pangka_": "182",
    "pangkajene sidenreng": "183",
    "pangkalan bun": "184",
    "pangkalpinang": "185",
    "panyabungan": "186",
    "pare": "187",
    "parepare": "188",
    "pariaman": "189",
    "pasuruan": "190",
    "pati": "191",
    "payakumbuh": "192",
    "pekalongan": "193",
    "pekan baru": "194",
    "pemalang": "195",
    "pematangsiantar": "196",
    "pendopo": "197",
    "pinrang": "198",
    "pleihari": "199",
    "polewali": "200",
    "pondok gede": "201",
    "ponorogo": "202",
    "pontianak": "203",
    "poso": "204",
    "prabumulih": "205",
    "praya": "206",
    "probolinggo": "207",
    "purbalingga": "208",
    "purukcahu": "209",
    "purwakarta": "210",
    "purwodadigrobogan": "211",
    "purwokerto": "212",
    "purworejo": "213",
    "putussibau": "214",
    "raha": "215",
    "rangkasbitung": "216",
    "rantau": "217",
    "rantauprapat": "218",
    "rantepao": "219",
    "rembang": "220",
    "rengat": "221",
    "ruteng": "222",
    "sabang": "223",
    "salatiga": "224",
    "samarinda": "225",
    "sambas, kalbar": "313",
    "sampang": "226",
    "sampit": "227",
    "sanggau": "228",
    "sawahlunto": "229",
    "sekayu": "230",
    "selong": "231",
    "semarang": "232",
    "sengkang": "233",
    "serang": "234",
    "serui": "235",
    "sibolga": "236",
    "sidikalang": "237",
    "sidoarjo": "238",
    "sigli": "239",
    "singaparna": "240",
    "singaraja": "241",
    "singkawang": "242",
    "sinjai": "243",
    "sintang": "244",
    "situbondo": "245",
    "slawi": "246",
    "sleman": "247",
    "soasiu": "248",
    "soe": "249",
    "solo": "250",
    "solok": "251",
    "soreang": "252",
    "sorong": "253",
    "sragen": "254",
    "stabat": "255",
    "subang": "256",
    "sukabumi": "257",
    "sukoharjo": "258",
    "sumbawa besar": "259",
    "sumedang": "260",
    "sumenep": "261",
    "sungai liat": "262",
    "sungai penuh": "263",
    "sungguminasa": "264",
    "surabaya": "265",
    "surakarta": "266",
    "tabanan": "267",
    "tahuna": "268",
    "takalar": "269",
    "takengon": "270",
    "tamiang layang": "271",
    "tanah grogot": "272",
    "tangerang": "273",
    "tanjung balai": "274",
    "tanjung enim": "275",
    "tanjung pandan": "276",
    "tanjung pinang": "277",
    "tanjung redep": "278",
    "tanjung selor": "279",
    "tapak tuan": "280",
    "tarakan": "281",
    "tarutung": "282",
    "tasikmalaya": "283",
    "tebing tinggi": "284",
    "tegal": "285",
    "temanggung": "286",
    "tembilahan": "287",
    "tenggarong": "288",
    "ternate": "289",
    "tolitoli": "290",
    "tondano": "291",
    "trenggalek": "292",
    "tual": "293",
    "tuban": "294",
    "tulung agung": "295",
    "ujung berung": "296",
    "ungaran": "297",
    "waikabubak": "298",
    "waingapu": "299",
    "wamena": "300",
    "watampone": "301",
    "watansoppeng": "302",
    "wates": "303",
    "wonogiri": "304",
    "wonosari": "305",
    "wonosobo": "306",
    "yogyakarta": "307"
  };

  const cityList = Object.keys(cityMapping).map(key => ({ name: key.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').replace(/,/g, ', '), id: cityMapping[key] }));

  const baseUrl = 'https://jadwalsholat.org/jadwal-sholat/ajax/ajax.daily1.php';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Mobile Safari/537.36',
    'Referer': 'https://jadwalsholat.org/jadwal-sholat/ajax.row.php'
  };

  try {
    const cityParam = req.query.city;
    if (!cityParam) {
      res.errorJson({ error: 'Eh, kota mana nih yang mau dicari?', available_cities: cityList },400);
      return;
    }

    const normalizedCity = cityParam.toLowerCase().trim();
    const cityId = cityMapping[normalizedCity];

    if (!cityId) {
      res.status(400).json({ error: `Waduh, kota "${cityParam}" nggak nemu nih di daftar. Coba cek lagi.`, available_cities: cityList });
      return;
    }

    const url = `${baseUrl}?id=${cityId}`;

    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);

    const year = $('#yr').val();
    const month = $('#mn').val();
    const day = $('#dt').val();
    const type = $('#tp').val();
    const date = $('.table_adzan2 tr:nth-child(1) b').text().trim();

    const shubuh = $('.table_adzan2 tr:nth-child(3) td:nth-child(2)').text().trim();
    const dzuhur = $('.table_adzan2 tr:nth-child(4) td:nth-child(2)').text().trim();
    const ashr = $('.table_adzan2 tr:nth-child(5) td:nth-child(2)').text().trim();
    const maghrib = $('.table_adzan2 tr:nth-child(6) td:nth-child(2)').text().trim();
    const isya = $('.table_adzan2 tr:nth-child(7) td:nth-child(2)').text().trim();

    const prayerTimes = {
      shubuh,
      dzuhur,
      ashr,
      maghrib,
      isya
    };

    res.successJson({
      city: cityParam,
      city_id: cityId,
      date,
      year,
      month,
      day,
      type,
      prayer_times: prayerTimes
    });

  } catch (e) {
    if (e.response && e.response.status === 400) {
         res.errorJson({ error: `Gagal ambil data nih buat ID kota ${cityId}. Coba cek daftar kota ya.`, available_cities: cityList },400);
    } else {
         res.errorJson({ error: 'Yah, gagal nyedot data jadwal sholat nih. Coba lagi nanti ya.' });
    }
  }
});

router.get('/fakeshop-image', async (req, res) => {
  try {
    const {
      search,
      judul,
      harga,
      thumbnail
    } = req.query;

    if (!search || !judul || !harga || !thumbnail) {
      return res.errorJson('Ups, ada parameter yang kurang nih. Pastikan ada search, judul, harga, dan thumbnail ya.', 400);
    }

    const targetUrl = `https://express-vercel-ytdl.vercel.app/fakeshop-cuy?search=${encodeURIComponent(search)}&judul=${encodeURIComponent(judul)}&harga=${encodeURIComponent(harga)}&thumbnail=${encodeURIComponent(thumbnail)}`;

     const response = await axios.get(targetUrl, {
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'image/jpeg');
    response.data.pipe(res);

  } catch (e) {
    res.errorJson('Yah, ada masalah pas ngambil gambar nih. Coba lagi ya.');
  }
});
router.get('/image-hentai', async (req, res) => {
  const ajaxUrl = 'https://aihentai.co/wp-admin/admin-ajax.php';
  const postData = 'action=get_random_image_url';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Mobile Safari/537.36',
    'Referer': 'https://aihentai.co/random/'
  };

  let imageUrl = null;
  const maxAttempts = 10;
  let attempts = 0;

  while (!imageUrl && attempts < maxAttempts) {
    attempts++;
    try {
      const ajaxResponse = await axios.post(ajaxUrl, postData, { headers });
      const responseData = ajaxResponse.data;

      if (typeof responseData === 'string') {
         if (responseData.startsWith('http')) {
             imageUrl = responseData.trim();
         }
      } else if (typeof responseData === 'object') {
          if (responseData.url && typeof responseData.url === 'string' && responseData.url.startsWith('http')) {
              imageUrl = responseData.url.trim();
          } else if (responseData.data && typeof responseData.data.url === 'string' && responseData.data.url.startsWith('http')) {
              imageUrl = responseData.data.url.trim();
          }
      }

      if (!imageUrl) {
          await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (!imageUrl) {
    return res.errorJson('Failed to obtain image URL after multiple attempts.', 500);
  }

  try {
  const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
const contentType = imageResponse.headers['content-type'];

if (!contentType || !contentType.startsWith('image/')) {
    return res.errorJson('URL did not provide an image.', 500);
}

res.setHeader('Content-Type', contentType);
imageResponse.data.pipe(res);

  } catch (error) {
    res.errorJson('Failed to fetch image.', 500);
  }
});
router.get('/random-anime-image', async (req, res) => {
  try {
    const { type } = req.query;
    
    const allowedTypes = ['waifu', 'neko', 'cry', 'blush', 'cuddle', 'kiss'];
    if (!type || !allowedTypes.includes(type)) {
      return res.errorJson('Type-nya ga valid cuy! Pilih salah satu dari: ' + allowedTypes.join(', '), 400);
    }
    
    const apiUrl = `https://api.waifu.pics/sfw/${type}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://random-image-v1.vercel.app/'
      }
    });
    
    const imageUrl = response.data.url;
    const imageResp = await axios.get(imageUrl, { responseType: 'stream' });
    const contentType = imageResp.headers['content-type'] || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    imageResp.data.pipe(res);

  } catch (err) {
    console.error('Error cuy:', err.message);
    res.errorJson('Ada error cuy, coba lagi nanti!', 500);
  }
});

router.get('/gemmachat', async (req, res) => {
  const { user, system, prompt } = req.query;

  if (!user || !system || !prompt) {
    return res.errorJson('Isi lengkap dulu cuy, butuh user, system, sama prompt', 400);
  }

  try {
    const response = await axios.post(
      `https://copper-ambiguous-velvet.glitch.me/chat?user=${encodeURIComponent(user)}`,
      {
        message: prompt,
        systemPrompt: system
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.38 Mobile Safari/537.36',
          'Referer': 'https://copper-ambiguous-velvet.glitch.me/'
        }
      }
    );

    res.successJson(response.data);

  } catch (err) {
    console.error('Error calling external API:', err);
    res.errorJson('Gagal cuy, ada masalah waktu ambil data', 500);
  }
});

router.get('/elevenlabs', async (req, res) => {
  const baseUrls = [
    'https://elevenlabs-crack.vercel.app',
    'https://elevenlabs-crack-qyb7.vercel.app',
    'https://elevenlabs-crack-f2zu.vercel.app'
  ];

  const text = req.query.text;
  let model = req.query.model;
  if (!text) return res.errorJson('Missing text parameter');

  for (let i = 0; i < 3; i++) {
    const baseUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)];
    try {
      if (!model || model === "getList") {
        const { data: html } = await axios.get(baseUrl + '/');
        const $ = cheerio.load(html);
        const options = $('#ttsForm select[name="model"] option').map((_, el) => $(el).val()).get();
        return res.succesJson({ models: options });
      }

      const payload = new URLSearchParams();
      payload.append('model', model);
      payload.append('text', text);

      const response = await axios.post(`${baseUrl}/generate-audio`, payload.toString(), {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Referer': baseUrl + '/'
  },
  responseType: 'stream'
});

res.set({
  'Content-Type': response.headers['content-type'],
  'Content-Length': response.headers['content-length']
});
return response.data.pipe(res);
    } catch (e) {}
  }

  res.errorJson('Mungkin model Tidak tersedia Atau tunggu beberapa menit untuk mencoba lagi, jika berlanjut hubungi PurPur', 500);
});

router.get('/jadibabi', async (req, res) => {
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
});


router.get('/lirik', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.errorJson({ error: 'Parameter q (query) diperlukan.' }, 400);
    }

    const url = `https://www.lyrics.com/lyrics/${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
                'Referer': `https://www.lyrics.com/lyrics/${encodeURIComponent(query)}`,
            },
            decompress: true,
        });

        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const lyricDiv = $('.sec-lyric.clearfix').first();
        const lyricBody = lyricDiv.find('.lyric-body').text().trim();

        if (lyricBody) {
            res.succesJson({ lyrics: lyricBody });
        } else {
            res.errorJson({ error: 'Lirik tidak ditemukan.' }, 404);
        }
    } catch (error) {
        res.errorJson({ error: 'Terjadi kesalahan saat mengambil lirik.' });
    }
});

router.get('/youtube-audio', async (req, res) => {
  try {
    const { url: youtubeUrl } = req.query;

    if (!youtubeUrl) {
      return res.errorJson("Parameter 'url' diperlukan", 400);
    }

    if (!/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(youtubeUrl)) {
      return res.errorJson("Parameter 'url' harus berupa URL YouTube yang valid", 400);
    }

    const initialUrl = 'https://ytmp3.ing/';
    const audioUrl = 'https://ytmp3.ing/audio';
    const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36';

    const initialResponse = await axios.get(initialUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': initialUrl,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
      }
    });

    const $ = cheerio.load(initialResponse.data);
    const csrfToken = $('form.download-form input[name="csrfmiddlewaretoken"]').val();

    if (!csrfToken) {
      return res.errorJson("Tidak dapat menemukan csrfmiddlewaretoken", 500);
    }

    const cookies = initialResponse.headers['set-cookie'];
    let cookieString = '';
    if (cookies) {
      cookieString = cookies.map(cookie => cookie.split(';')[0]).join('; ');
    }

    const payload = new URLSearchParams();
    payload.append('url', youtubeUrl);

    const audioResponse = await axios.post(audioUrl, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': csrfToken,
        'User-Agent': userAgent,
        'Referer': initialUrl,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': '*/*',
        'Origin': 'https://ytmp3.ing',
        'Cookie': cookieString
      },
      responseType: 'json'
    });

    if (!audioResponse.data || !audioResponse.data.url || !audioResponse.data.filename) {
      return res.errorJson("Respons tidak valid dari API audio", 500);
    }

    const encodedUrl = audioResponse.data.url;
    const filename = audioResponse.data.filename;

    const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');

    res.succesJson({ decodedUrl, filename });

  } catch (error) {
    let errorMessage = error.message;
    let status = 500;
    if (error.response) {
      status = error.response.status;
      errorMessage = `Error ${error.response.status}: ${error.response.statusText || 'Gagal mengambil data'}`;
      if (error.response.data && typeof error.response.data === 'object') {
        errorMessage += ` - ${JSON.stringify(error.response.data)}`;
      } else if (error.response.data) {
        errorMessage += ` - ${error.response.data}`;
      }
    } else if (error.request) {
      errorMessage = "Tidak ada respons dari server";
    }
    res.errorJson(errorMessage, status);
  }
});

router.get('/anime-quotes', async (req, res) => {
  try {
    const axios = require('axios');
    const cheerio = require('cheerio');
    const url = 'https://www.gramedia.com/best-seller/kata-kata-bijak-anime/';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': url
    };

    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);

    const quotes = [];
    $('li[style="font-weight: 400;"][aria-level="1"]').each((index, element) => {
      quotes.push($(element).text().trim());
    });

    if (quotes.length === 0) {
      return res.errorJson('No matching quotes found.', 200);
    }

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    res.succesJson(randomQuote);

  } catch (error) {
    res.errorJson(error.message, 500);
  }
});

router.get('/bluefire', async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) {
            return res.errorJson('Parameter text diperlukan', 400);
        }

        const apiUrl = 'https://www.flamingtext.com/net-fu/image_output.cgi';
        const params = {
            _comBuyRedirect: 'false',
            script: 'blue-fire',
            text: text,
            symbol_tagname: 'popular',
            fontsize: '70',
            fontname: 'futura_poster',
            fontname_tagname: 'cool',
            textBorder: '15',
            growSize: '0',
            antialias: 'on',
            hinting: 'on',
            justify: '2',
            letterSpacing: '0',
            lineSpacing: '0',
            textSlant: '0',
            textVerticalSlant: '0',
            textAngle: '0',
            textOutline: 'false',
            textOutlineSize: '2',
            textColor: '#0000CC',
            angle: '0',
            blueFlame: 'false',
            frames: '5',
            pframes: '5',
            oframes: '4',
            distance: '2',
            transparent: 'false',
            extAnim: 'gif',
            animLoop: 'on',
            defaultFrameRate: '75',
            doScale: 'off',
            scaleWidth: '240',
            scaleHeight: '120',
            _: Date.now()
        };

        const headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
            'Referer': 'https://www.flamingtext.com/net-fu/dynamic.cgi?script=blue-fire'
        };

        const apiResponse = await axios.get(apiUrl, { params, headers });

        if (apiResponse.data && apiResponse.data.src) {
            const imageUrl = apiResponse.data.src;
const imageResponse = await axios({
  method: 'get',
  url: imageUrl,
  responseType: 'stream',
  headers: {
    'User-Agent': headers['User-Agent'],
    'Referer': apiUrl
  }
});
res.setHeader('Content-Type', 'image/gif');
imageResponse.data.pipe(res);
        } else {
             res.errorJson(new Error('Gagal mendapatkan URL gambar dari API FlamingText'), 500);
        }

    } catch (error) {
         res.errorJson(error, 500);
    }
});

router.get('/fireLogo', async (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.errorJson('Parameter "text" is required', 400);
    }

    const params = {
      _comBuyRedirect: "false",
      script: "fire-logo",
      text: text,
      symbol_tagname: "popular",
      fontsize: "70",
      fontname: "Cry Uncial",
      fontname_tagname: "cool",
      textBorder: "20",
      growSize: "0",
      antialias: "on",
      hinting: "on",
      justify: "2",
      letterSpacing: "0",
      lineSpacing: "0",
      textSlant: "0",
      textVerticalSlant: "0",
      textAngle: "0",
      textOutline: "false",
      textOutlineSize: "2",
      textColor: "#000000",
      fireSize: "70",
      backgroundResizeToLayers: "on",
      backgroundRadio: "1",
      backgroundColor: "#000000",
      backgroundPattern: "Wood",
      backgroundPattern_tagname: "standard",
      backgroundGradient: "Web20 Blue 3D #10",
      backgroundGradient_tagname: "standard",
      backgroundGradientAngle: "180",
      backgroundGradientCenterX: "50",
      backgroundGradientCenterY: "50",
      backgroundStarburstColorAlt: "#ED2400",
      backgroundStarburstColor1: "#BD2409",
      backgroundStarburstNum: "25",
      backgroundStarburstRayPercentage: "50",
      backgroundStarburstUseColor2: "false",
      backgroundStarburstColor2: "#000000",
      backgroundStarburstOffsetAngle: "0",
      backgroundStarburstXOffset: "0",
      backgroundStarburstYOffset: "0",
      backgroundStarburstCenterPercentage: "2",
      backgroundStarburstRadiusX: "1000",
      backgroundStarburstRadiusY: "1000",
      backgroundStarburstCF1: "0",
      backgroundUseOverlay: "off",
      backgroundOverlayMode: "5",
      backgroundOverlayPattern: "Parque #1",
      backgroundOverlayPattern_tagname: "standard",
      backgroundOverlayOpacity: "100",
      backgroundImageUrl: "http://www.flamingtext.com/images/textures/texture3.jpg",
      useFixedSize: "false",
      imageWidth: "400",
      imageHeight: "150",
      imageAlignment: "4",
      autocrop: "false",
      autocropPadding: "0",
      watermark: "none",
      ext: "png",
      jpgQuality: "85",
      doScale: "off",
      scaleWidth: "240",
      scaleHeight: "120",
      _: Date.now()
    };

    const headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': 'https://www.flamingtext.com/logo/Design-Fire'
    };

    const response = await axios.get('https://www.flamingtext.com/net-fu/image_output.cgi', {
      params: params,
      headers: headers
    });

    const gambarResponse = await axios.get(response.data.src, { responseType: 'stream' });
res.setHeader('Content-Type', 'image/png');
gambarResponse.data.pipe(res);
  } catch (error) {
    let errorMessage = error.message;
    let status = 500;
    if (error.response) {
      status = error.response.status;
      errorMessage = `API Error: ${error.response.status} ${error.response.statusText}`;
      if (typeof error.response.data === 'string' && error.response.data.length < 200) {
        errorMessage += ` - ${error.response.data}`;
      }
    } else if (error.request) {
      errorMessage = 'API Error: No response received from server.';
    }
    res.errorJson(errorMessage, status);
  }
});

router.get('/wikipedia-random', async (req, res) => {
    try {
        const url = 'https://id.m.wikipedia.org/wiki/Special:Random';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const judul = $('span.mw-page-title-main').text().trim() || "";
        const deskripsi = $('p')
            .first()
            .text()
            .trim()
            .replace(/\[\d+\]/g, '') || "";
        
        const gambar = $('span[typeof="mw:File"] img')
            .map((i, el) => `https:${$(el).attr('src')}`)
            .get();
        
        res.json({
            judul,
            deskripsi,
            gambar
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

router.get('/anime-popular', async (req, res) => {
  try {
    const response = await axios.get('https://myanimelist.net/topanime.php?type=bypopularity', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.40 Mobile Safari/537.36',
        'Referer': 'https://myanimelist.net/topanime.php?type=bypopularity'
      }
    });

    const $ = cheerio.load(response.data);
    const result = [];

    $('.information').each((_, el) => {
      const rank = $(el).find('.rank .text').text().trim();
      const title = $(el).find('.title').text().trim();
      const type = $(el).find('.misc .type').text().trim();
      const score = $(el).find('.score').text().trim();
      const members = $(el).find('.member').text().trim();
      const link = $(el).next('.thumb').attr('href') || '';

      const imgDiv = $(el).parent().next('.tile-unit');
      const image = imgDiv.data('bg') || '';

      if (rank && title) {
        result.push({ rank, title, type, score, members, link, image });
      }
    });

    res.succesJson(result);
  } catch (error) {
    res.errorJson({ error: error.message });
  }
});

router.get('/jadwaltv', async (req, res) => {
  const channel = req.query.channel ? req.query.channel.toLowerCase().trim() : '';
  if (!channel) {
    return res.status(400).json({ error: 'Channel parameter is required' });
  }

  const url = `https://www.jadwaltv.net/channel/${channel}`;
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const result = [];
    $('tr.jklIv').each((i, el) => {
      const time = $(el).find('td').first().text().trim();
      const program = $(el).find('td').last().text().trim();
      result.push({ time, program });
    });
    res.succesJson(result);
  } catch (err) {
    res.errorJson({ error: err.toString() });
  }
});

router.get('/tangga-lagu', async (req, res) => {
    try {
        const { data } = await axios.get('https://www.jadwaltv.net/tangga-lagu-youtube-tangga-lagu-indonesia-terbaru');
        const $ = cheerio.load(data);
        const songs = [];

        $('tr').each((_, el) => {
            const rank = $(el).find('td:nth-child(1)').text().trim();
            const img = $(el).find('td:nth-child(2) img').attr('data-src') || $(el).find('td:nth-child(2) img').attr('src');
            const title = $(el).find('td:nth-child(3) strong').text().trim();
            const artist = $(el).find('td:nth-child(3) span').text().trim();
            const youtube = $(el).find('td:nth-child(4) a').attr('href');
            const spotify = $(el).find('td:nth-child(5) a').attr('href');

            if (rank && title && img.startsWith('http')) {
                songs.push({ rank, img, title, artist, youtube, spotify });
            }
        });

        res.succesJson(songs);
    } catch (error) {
        res.errorJson({ error: 'Failed to fetch data' });
    }
});

router.get('/kecocokan', async (req, res) => {
  const { nama1, nama2 } = req.query;
  try {
        const response = await axios.get(`https://express-vercel-ytdl.vercel.app/kecocokan?nama1=${nama1}&nama2=${nama2}`, {
      responseType: 'stream'
    });
    res.setHeader('Content-Type', 'image/jpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.errorJson('Failed to fetch image');
  }
});

router.get('/anime-search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.errorJson('Masukkan judul anime yang ingin dicari', 400);
  }

  try {
    const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&sfw`);
    const result = response.data.data;

    if (result.length === 0) {
      return res.errorJson('Anime tidak ditemukan.', 404);
    }

    const anime = result[0];
    const originalSynopsis = anime.synopsis;
    const aiPrompt = `Terjemahkan dan ringkas sinopsis berikut ke dalam Bahasa Indonesia dengan kalimat yang jelas dan santai. Hasilnya hanya berupa teks terjemahan dan ringkasan sinopsis, tanpa format tambahan seperti bullet points, nomor, atau simbol lainnya.
Sinopsis:
${originalSynopsis}`;

    const geminiResponse = await axios.get(`https://nirkyy.koyeb.app/api/v1/gemini?prompt=${encodeURIComponent(aiPrompt)}`);
    const summarizedSynopsis = geminiResponse.data.data;

    const genres = anime.genres.map(genre => genre.name).join(', ');
    const themes = anime.themes.map(theme => theme.name).join(', ');

    res.succesJson({
      thumbnail: `https://nirkyy.koyeb.app/api/v1/image-random?query=${encodeURIComponent(anime.title)}`,
      thumb_original: anime.images.jpg.image_url,
      title: anime.title,
      genre: genres,
      theme: themes,
      rating: anime.score,
      sinopsis: summarizedSynopsis.trim(),
      template: `*Title:* ${anime.title}\n*Genre:* ${genres}\n*Theme:* ${themes}\n*Rating:* ${anime.score}\n\n*Sinopsis:* ${summarizedSynopsis.trim()}`
    });
  } catch (error) {
    console.error('Error searching for anime:', error);
    res.errorJson('Terjadi kesalahan saat mencari anime.');
  }
});

router.get('/soundoftext', async (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).send('Parameter "text" is required.');
  }

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.soundoftext.com/sounds',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://soundoftext.com',
        'Referer': 'https://soundoftext.com/',
        'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"Android"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
      },
      data: {
        engine: 'Google',
        data: {
          text: text,
          voice: 'id-ID',
        },
      },
    });
    response.data.id = "https://files.soundoftext.com/"+response.data.id+".mp3"
    res.succesJson(response.data.id);
  } catch (error) {
    console.error('Error calling Sound of Text API:', error);
    if (error.response) {
      res.errorJson(error.response.data);
    } else {
      res.errorJson('Internal Server Error');
    }
  }
});

router.get('/deepseek', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    const response = await axios.post(
      'https://www.multichatai.com/api/chat/deepinfra',
      {
        chatSettings: {
          model: 'deepseek-ai/DeepSeek-R1',
          prompt: 'You are a friendly, helpful AI assistant.',
          temperature: 0.5,
          contextLength: 32000,
          includeProfileContext: true,
          includeWorkspaceInstructions: true,
          embeddingsProvider: 'openai',
        },
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        customModelId: '',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'accept-language': 'en-US,en;q=0.9,en-GB;q=0.8,en-IN;q=0.7',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'referrer': 'https://www.multichatai.com/1ed886c3-9f08-4090-9e44-123456/chat?model=claude-3-5-sonnet',
          'referrerPolicy': 'strict-origin-when-cross-origin',
        },
      }
    );

    res.succesJson(response.data);
  } catch (error) {
    console.error('Error calling Deepinfra API:', error);
    res.errorJson({ error: 'Failed to process the request' });
  }
});

router.get('/speechma', speechma);
router.get('/brats', async (req, res) => {
  const host = req.query.host;
  const text = req.query.text;

  if (!host || !text) {
    return res.errorJson({ error: "Parameter 'host' dan 'text' harus disediakan." },400);
  }

  try {
    const apiUrl = `https://express-vercel-ytdl.vercel.app/brats?host=${encodeURIComponent(host)}&text=${encodeURIComponent(text)}`;
    const response = await axios.get(apiUrl, { responseType: 'stream' });
    res.setHeader('Content-Type', 'image/png');
    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching or streaming brats image:", error);
    res.errorJson({ error: "Gagal mengambil atau mengirim gambar brats." });
  }
});

router.get('/artinama', async (req, res) => {
  const nama = req.query.nama;

  if (!nama) {
    return res.errorJson({ error: "Parameter 'nama' harus disediakan." },400);
  }

  try {
    const apiUrl = `https://express-vercel-ytdl.vercel.app/arti?nama=${encodeURIComponent(nama)}`;
const response = await axios.get(apiUrl, { responseType: 'stream' });
res.setHeader('Content-Type', 'image/jpeg');
response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching or streaming khodam image:", error);
    res.errorJson({ error: "Gagal mengambil atau mengirim gambar khodam." });
  }
});

router.get('/khodam', async (req, res) => {
  const nama = req.query.nama;

  if (!nama) {
    return res.errorJson({ error: "Parameter 'nama' harus disediakan." },400);
  }

  try {
    const apiUrl = `https://express-vercel-ytdl.vercel.app/khodam?nama=${encodeURIComponent(nama)}`;
    const response = await axios.get(apiUrl, { responseType: 'stream' });
    res.setHeader('Content-Type', 'image/jpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching or streaming khodam image:", error);
    res.errorJson({ error: "Gagal mengambil atau mengirim gambar khodam." });
  }
});

router.get('/snapsave', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.errorJson({ error: "Parameter 'url' harus disediakan." },400);
  }
  try {
    await snapsave(req, res);
  } catch (error) {
    console.error("Error processing snapsave request:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan snapsave." });
  }
});


router.get('/imagine', imagine)

router.get('/simsimi', async (req, res) => {
  const msg = req.query.msg;
  const id = req.query.lang || "id";

  if (!msg) {
    return res.errorJson({ error: "Parameter 'msg' harus disediakan." },400);
  }

  try {
    const response = await axios.post('https://simsimi.vn/web/simtalk', `text=${encodeURIComponent(msg)}&lc=${id}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    res.succesJson({ respon: response.data.success });
  } catch (error) {
    console.error("Error calling SimSimi API:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan SimSimi." });
  }
});

router.get('/generate-query', async (req, res) => {
  const user = req.query.user;
  const msg = req.query.msg;

  if (!user || !msg) {
    return res.errorJson({ error: "Parameter 'user' dan 'msg' harus disediakan." },400);
  }

  try {
    let response = await gq.botika(user, msg);
    response = response.replace(/Alicia:/i, "").trim();
    res.succesJson(JSON.parse(response));
  } catch (error) {
    console.error("Error calling alicia.botika:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan." });
  }
});

router.get('/alicia', async (req, res) => {
  const user = req.query.user;
  const msg = req.query.msg;

  if (!user || !msg) {
    return res.errorJson({ error: "Parameter 'user' dan 'msg' harus disediakan." },400);
  }

  try {
    let response = await alicia.botika(user, msg);
    response = response.replace(/Alicia:/i, "").trim();
    res.succesJson({ response });
  } catch (error) {
    console.error("Error calling alicia.botika:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan." });
  }
});

router.get('/memegen', async (req, res) => {
  const { text_atas, text_bawah, background } = req.query;
  let url = 'https://api.memegen.link/images/custom';
  if (text_atas || text_bawah) {
    const atas = text_atas ? encodeURIComponent(text_atas) : ' ';
    const bawah = text_bawah ? encodeURIComponent(text_bawah) : ' ';
    url += `/${atas}/${bawah}.png`;
  } else {
    return res.errorJson({ error: 'Parameter text-atas atau text-bawah harus diisi.' },400);
  }
  if (background) {
    url += `?background=${encodeURIComponent(background)}`;
  }
  try {
    const response = await axios.get(url, { responseType: 'stream' });
res.set('Content-Type', 'image/png');
response.data.pipe(res);
  } catch (error) {
    console.error('Error saat memanggil API memegen:', error);
    res.errorJson({ error: 'Terjadi kesalahan saat memproses permintaan.' });
  }
});

router.get('/autogempa', async (req, res) => {
  try {
    const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
    const data = response.data;
    if (data && data.Infogempa && data.Infogempa.gempa) {
      data.Infogempa.gempa.Shakemap = "https://data.bmkg.go.id/DataMKG/TEWS/" + data.Infogempa.gempa.Shakemap;
      res.succesJson(data.Infogempa.gempa);
    } else {
      res.errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' },404);
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data autogempa:', error);
    if (error.response) {
      res.errorJson({ message: `Kesalahan server: ${error.response.statusText}` });
    } else if (error.request) {
      res.errorJson({ message: 'Tidak dapat terhubung ke server BMKG.' });
    } else {
      res.errorJson({ message: 'Terjadi kesalahan saat mengambil data autogempa.' });
    }
  }
});

router.get('/susunkata', async (req, res) => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/susunkata.json');
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomItem = data[randomIndex];
      res.succesJson(randomItem);
    } else {
      res.errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' },404);
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data:', error);
    res.errorJson({ message: 'Terjadi kesalahan saat mengambil data.' });
  }
});

router.get('/asahotak', async (req, res) => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/asahotak.json');
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomItem = data[randomIndex];
      res.succesJson(randomItem);
    } else {
      res.errorJson({ message: 'Data tidak ditemukan atau format tidak valid.' },404);
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data:', error);
    res.errorJson({ message: 'Terjadi kesalahan saat mengambil data.' });
  }
});

router.get('/savetube', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.errorJson("Masukkan parameter url",400);
  if (!format) return res.errorJson("Masukkan parameter format",400);
  try {
    let response;
    try {
      response = await axios.get(`https://pursky.vercel.app/api/ytdl?url=${url}?si=HJ1GvDr8o1dNUKcB&format=${format}`);
    } catch (firstError) {
      try {
        response = await axios.get(`https://pursky.vercel.app/api/ytdl?url=${url}?si=HJ1GvDr8o1dNUKcB&format=${format}`);
      } catch (secondError) {
        return res.errorJson(secondError);
      }
    }
    if (response.status !== 200) return res.errorJson("Terjadi kesalahan saat mengunduh video");
    return res.succesJson(response.data);
  } catch (error) {
    return res.errorJson(error);
  }
});

router.get('/anime-jadwal', async (req, res) => {
  const hari = req.query.hari;
  if (!hari) {
    return res.errorJson("Hari tidak valid. Masukkan nama hari dalam bahasa Inggris atau Indonesia",400)
  }
  try {
    const response = await jadwal(hari.trim());
    if (response.includes("Hari tidak valid.")) {
      return res.errorJson(response,400)
    }
    return res.succesJson(response);
  } catch (error) {
    return res.errorJson({ error: error.message });
  }
});

router.get('/pin', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.errorJson("Search query cannot be empty.",400);
  try {
    const result = await pin.search(query);
    if (result.status) {
      return res.succesJson(result.result);
    } else {
      return res.errorJson(result.result);
    }
  } catch (error) {
    return res.errorJson(error.message);
  }
});

router.get('/llm', async (req, res) => {
  let { groqKey, model = 'gemma2-9b-it', systemPrompt = " ", msg, user } = req.query;
  if (!groqKey) return res.errorJson("groqKey is required",400);
  if (!msg) return res.errorJson("msg is required",400);
  if (!user) return res.errorJson("user is required",400);
  if (groqKey.includes('Bearer')) groqKey = groqKey.replace('Bearer ', '').trim();
  try {
    const response = await handleTextQuery({ groqKey, model, systemPrompt, msg, user });
    if (response.reply.includes('API Error')) return res.errorJson(response.reply);
    return res.succesJson(response);
  } catch (error) {
    return res.errorJson(error);
  }
});


module.exports = router;