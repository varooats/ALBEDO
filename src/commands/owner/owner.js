const { createCommand } = require('../../core/command.factory');
const config = require('../../config/bot.config');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'owner',
  aliases: ['pemilik', 'ownercontact'],
  description: 'Kontak pemilik bot.',
  execute: (client, message) => sendInfoReply(client, message, 'owner', config),
});
