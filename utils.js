// utils.js

const axios = require('axios');

function sendToDiscordWebhook(webhookURL, message) {
  axios.post(webhookURL, { content: message })
    .then(response => console.log('Message sent to Discord'))
    .catch(error => console.error('Error sending message to Discord:', error.message));
}

module.exports = { sendToDiscordWebhook };
