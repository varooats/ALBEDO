const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');
const { replyText } = require('../../core/reply');
const { getSenderJid } = require('../../utils/message');
const { sendTicketToOwners } = require('../../services/support/support.service');

module.exports = createCommand({
  name: 'bug',
  aliases: ['laporbug', 'reportbug', 'error'],
  category: 'support',
  description: 'Laporkan bug atau error pada bot.',
  execute: async (client, message, args = []) => {
    const content = args.join(' ').trim();
    if (!content) {
      return sendInfoReply(client, message, 'bug');
    }

    const groupJid = message?.key?.remoteJid;
    let groupName = '';
    if (groupJid && groupJid.endsWith('@g.us')) {
      try {
        const meta = await client.groupMetadata(groupJid);
        groupName = meta?.subject || '';
      } catch {}
    }

    const senderJid = getSenderJid(message);
    await sendTicketToOwners(client, {
      type: 'bug',
      senderJid,
      groupJid,
      groupName,
      content,
    });

    return replyText(
      client,
      message,
      '🐛 *LAPORAN BUG TERKIRIM*\n\nDetail bug/error telah diteruskan ke Developer & Owner bot untuk ditindaklanjuti. Terima kasih!'
    );
  },
});
