const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'rules',
  aliases: ['aturan', 'aturanbot'],
  description: 'Aturan penggunaan bot.',
  execute: (client, message) => sendInfoReply(client, message, 'rules'),
});
