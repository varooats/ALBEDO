const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');
const { replyText } = require('../../core/reply');
const { getSenderJid } = require('../../utils/message');
const { sendTicketToOwners } = require('../../services/support/support.service');

module.exports = createCommand({
  name: 'report',
  aliases: ['lapor'],
  category: 'support',
  description: 'Laporkan masalah terkait penggunaan bot.',
  execute: async (client, message, args = []) => {
    const content = args.join(' ').trim();
    if (!content) {
      return sendInfoReply(client, message, 'report');
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
      type: 'report',
      senderJid,
      groupJid,
      groupName,
      content,
    });

    return replyText(
      client,
      message,
      '✅ *LAPORAN TERKIRIM*\n\nLaporan kendala kamu telah diteruskan langsung ke Owner bot. Terima kasih atas laporannya!'
    );
  },
});
