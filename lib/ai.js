const axios = require('axios');
const fs = require('fs');
const path = require('path');
const openaiTokenCounter = require('openai-gpt-token-counter');
const DB_FOLDER = "./db";
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
const GEMMA_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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
  while (total > 2000 && history.length > 1) {
    history.shift();
    msgs = history;
    total = openaiTokenCounter.chat(msgs, "gpt-4");
  }
  return history;
};

const handleTextQuery = async ({ groqKey, model = 'gemma2-9b-it', systemPrompt = " ", msg, user = "default" }) => {
  if (!groqKey) throw new Error("groqKey is required");
  if (!msg) throw new Error("msg is required");
  let history = loadHistory(user);
  history.push({ role: "user", content: msg });
  history = manageTokenCount(history);
  const messages = [{ role: "system", content: systemPrompt }, ...history];
  let reply;
  try {
    const response = await axios.post(GEMMA_API_URL, { model, messages }, { headers: { Authorization: `Bearer ${groqKey}` } });
    reply = response.data.choices[0].message.content;
    history.push({ role: "assistant", content: reply });
    saveHistory(user, history);
  } catch (error) {
    reply = `API Error: ${error.message}`;
  }
  return { reply, history: history };
};

module.exports = { handleTextQuery };