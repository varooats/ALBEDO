const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { sendTyping } = require('../../utils/message.utils');

module.exports = createCommand({
  name: 'ping',
  aliases: ['p'],
  description: 'Cek respon bot di grup.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const start = Date.now();
    await sendTyping(client, jid, 'composing');
    const latency = Date.now() - start;
    await replyText(client, message, messages.bot.ping(latency));
    return true;
  },
});
