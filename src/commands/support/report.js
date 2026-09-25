const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'report',
  aliases: ['lapor', 'reportbug'],
  description: 'Laporkan masalah terkait penggunaan bot.',
  execute: (client, message) => sendInfoReply(client, message, 'report'),
});
