const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'faq',
  aliases: ['pertanyaan', 'tanya'],
  description: 'Pertanyaan yang sering ditanyakan.',
  execute: (client, message) => sendInfoReply(client, message, 'faq'),
});
