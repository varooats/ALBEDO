const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'help',
  aliases: ['bantuan', 'menuhelp'],
  description: 'Bantuan penggunaan bot dan daftar fitur.',
  execute: (client, message) => sendInfoReply(client, message, 'help'),
});
