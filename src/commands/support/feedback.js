const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'feedback',
  aliases: ['kritik', 'saran', 'masukan'],
  description: 'Kritik/saran untuk bot.',
  execute: (client, message) => sendInfoReply(client, message, 'feedback'),
});
