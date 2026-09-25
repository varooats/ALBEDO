const { createCommand } = require('../../core/command.factory');
const config = require('../../config/bot.config');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'ownerinfo',
  aliases: ['ownerprofile', 'profilowner'],
  description: 'Informasi profil pemilik bot.',
  execute: (client, message) => sendInfoReply(client, message, 'ownerinfo', config),
});
