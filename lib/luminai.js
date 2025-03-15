const axios = require('axios');
const fs = require('fs');
const path = require('path');
const openaiTokenCounter = require('openai-gpt-token-counter');
const DB_FOLDER = "./db";
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
const LUMINAI_API_URL = "https://luminai.my.id/";

const ensureDbFolder = () => {
  if (!fs.existsSync(DB_FOLDER)) fs.mkdirSync(DB_FOLDER, { recursive: true });
};

const cleanupOldHistory = (currentUser) => {
  ensureDbFolder();
  const files = fs.readdirSync(DB_FOLDER);
  files.forEach(file => {
    const parts = file.split('-');
    if (parts.length === 2) {
      const user = parts[0];
      const timestamp = parseInt(parts[1].replace('.json', ''), 10);
      if (user !== currentUser && !isNaN(timestamp) && Date.now() - timestamp > THREE_DAYS) {
        fs.unlinkSync(path.join(DB_FOLDER, file));
      }
    }
  });
};

const loadHistory = (user) => {
  ensureDbFolder();
  cleanupOldHistory(user);
  const files = fs.readdirSync(DB_FOLDER).filter(file => file.startsWith(user + '-') && file.endsWith('.json'));
  let history = [];
  let latestTimestamp = 0;
  let chosenFile = null;
  files.forEach(file => {
    const timestamp = parseInt(file.split('-')[1].replace('.json', ''), 10);
    if (!isNaN(timestamp) && timestamp > latestTimestamp) {
      latestTimestamp = timestamp;
      chosenFile = file;
    }
  });
  if (chosenFile) {
    try {
      history = JSON.parse(fs.readFileSync(path.join(DB_FOLDER, chosenFile), 'utf8'));
    } catch (e) {
      history = [];
    }
  }
  return history;
};

const saveHistory = (user, history) => {
  ensureDbFolder();
  const files = fs.readdirSync(DB_FOLDER).filter(file => file.startsWith(user + '-') && file.endsWith('.json'));
  files.forEach(file => fs.unlinkSync(path.join(DB_FOLDER, file)));
  const filename = `${user}-${Date.now()}.json`;
  fs.writeFileSync(path.join(DB_FOLDER, filename), JSON.stringify(history), 'utf8');
};

const manageTokenCount = (history) => {
  let msgs = history;
  let total = openaiTokenCounter.chat(msgs, "gpt-4");
  while (total > 1500 && history.length > 1) {
    history.shift();
    msgs = history;
    total = openaiTokenCounter.chat(msgs, "gpt-4");
  }
  return history;
};

const luminaAI = async ({ systemPrompt = " ", msg, user = "default" }) => {
  if (!msg) throw new Error("msg is required");
  let history = loadHistory(user);
  history.push({ role: "user", content: msg });
  history = manageTokenCount(history);
  let conversation = "";
  if (systemPrompt && systemPrompt.trim() !== "") {
    conversation += "System:" + systemPrompt.trim() + "\n";
  }
  history.forEach(m => {
    if (m.role === "user") conversation += "User:" + m.content + "\n";
    else if (m.role === "assistant") conversation += "Assistant:" + m.content + "\n";
  });
  conversation += "Assistant:";
  let reply;
  try {
    const response = await axios.post(LUMINAI_API_URL, { content: conversation }, { headers: { "Content-Type": "application/json" } });
    reply = response.data.result;
    history.push({ role: "assistant", content: reply });
    saveHistory(user, history);
  } catch (error) {
    reply = `API Error: ${error.message}`;
  }
  return { reply, history };
};

module.exports = { luminaAI };