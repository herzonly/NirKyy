const axios = require('axios');

async function botika(user, text, attempt = 1) {
  const timestamp = Date.now();
  const messageId = `${timestamp}${Math.floor(Math.random() * 1000)}`;
  const payload = {
    app: {
      id: "blaael9y3cu1706606677060",
      time: timestamp,
      data: {
        sender: { id: user },
        message: [{
          id: messageId,
          time: timestamp,
          type: "text",
          value: text
        }]
      }
    }
  };
  
  try {
    const response = await axios.post("https://webhook.botika.online/webhook/", payload, {
      headers: {
        "Authorization": "Bearer s9561k-znra-c37c54x8qxao0vox-nwm9g4tnrm-dp3brfv8",
        "Content-Type": "application/json"
      }
    });
    let reply = '';
    if (response.data && response.data.app && response.data.app.data && response.data.app.data.message) {
      reply = response.data.app.data.message.map(msg => {
        return msg && msg.value ? msg.value.replace(/<br\s*\/?>/gi, "\n") : "";
      }).join("\n");
    }
    if (reply.includes("aku belum mengerti dengan pertanyaanmu") && attempt < 3) {
      return await botika(user, text, attempt + 1);
    }
    return reply;
  } catch (error) {
    throw error;
  }
}

module.exports = async (req, res) => {
  const user = req.query.user;
  const msg = req.query.msg;

  if (!user || !msg) {
    return res.errorJson({ error: "Parameter 'user' dan 'msg' harus disediakan." }, 400);
  }

  try {
    let response = await botika(user, msg);
    response = response.replace(/Alicia:/i, "").trim();
    res.successJson({ response });
  } catch (error) {
    console.error("Error calling alicia.botika:", error);
    res.errorJson({ error: "Terjadi kesalahan saat memproses permintaan." });
  }
};