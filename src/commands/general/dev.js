const { createCommand } = require('../../core/command.factory');
const config = require('../../config/bot.config');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'dev',
  aliases: ['developer', 'contactdev'],
  description: 'Informasi developer bot.',
  execute: (client, message) => sendInfoReply(client, message, 'dev', config),
});
