const { createCommand } = require('../../core/command.factory');
const config = require('../../config/bot.config');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'github',
  aliases: ['gh', 'git'],
  description: 'Link profil GitHub developer.',
  execute: (client, message) => sendInfoReply(client, message, 'github', config),
});
