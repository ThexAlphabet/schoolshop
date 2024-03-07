// utils/sendToDiscordWebhook.js

const axios = require('axios');

function sendToDiscordWebhook(webhookURL, message) {
  axios.post(webhookURL, { content: message });
}

module.exports = sendToDiscordWebhook;
