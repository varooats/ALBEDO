const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

module.exports = createCommand({
  name: 'support',
  aliases: ['bantuanbot', 'helpdesk'],
  description: 'Informasi dan bantuan penggunaan bot.',
  execute: (client, message) => sendInfoReply(client, message, 'support'),
});
