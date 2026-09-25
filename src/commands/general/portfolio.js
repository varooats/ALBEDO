const { createCommand } = require('../../core/command.factory');
const config = require('../../config/bot.config');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'portfolio',
  aliases: ['portofolio', 'site'],
  description: 'Website/portfolio developer.',
  execute: (client, message) => sendInfoReply(client, message, 'portfolio', config),
});
