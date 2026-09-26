const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { getSenderJid } = require('../../utils/message');
const { setAfk, clearAfk } = require('../../services/afk/afk.service');

module.exports = createCommand({
  name: 'afk', description: 'Atur status AFK.', isFree: true,
  execute: async (client, message, args) => {
    const jid = getSenderJid(message);
    const reason = args.join(' ').trim();
    if (reason) {
      setAfk(jid, reason);
      return replyText(client, message, `AFK MODE\n\n${message.pushName || 'User'} sedang AFK.\n\nAlasan:\n${reason}`);
    }
    clearAfk(jid);
    return replyText(client, message, 'Status AFK dimatikan.');
  },
});
