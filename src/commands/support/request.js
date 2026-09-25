const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'request',
  aliases: ['minta', 'requestfitur'],
  description: 'Request fitur baru untuk bot.',
  execute: (client, message) => sendInfoReply(client, message, 'request'),
});
