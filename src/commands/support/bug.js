const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'bug',
  aliases: ['laporbug', 'error'],
  description: 'Laporkan bug atau error pada bot.',
  execute: (client, message) => sendInfoReply(client, message, 'bug'),
});
