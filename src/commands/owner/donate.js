const { createCommand } = require('../../core/command.factory');
const config = require('../../config/bot.config');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'donate',
  aliases: ['donasi', 'supportbot'],
  description: 'Informasi dukungan operasional bot.',
  execute: (client, message) => sendInfoReply(client, message, 'donate', config),
});
