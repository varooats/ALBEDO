const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');
const { replyText } = require('../../core/reply');
const { getSenderJid } = require('../../utils/message');
const { sendTicketToOwners } = require('../../services/support/support.service');

module.exports = createCommand({
  name: 'feedback',
  aliases: ['kritik', 'saran', 'masukan'],
  category: 'support',
  description: 'Kritik dan saran untuk bot.',
  execute: async (client, message, args = []) => {
    const content = args.join(' ').trim();
    if (!content) {
      return sendInfoReply(client, message, 'feedback');
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
      type: 'feedback',
      senderJid,
      groupJid,
      groupName,
      content,
    });

    return replyText(
      client,
      message,
      '💬 *FEEDBACK TERKIRIM*\n\nKritik dan saran kamu telah kami terima dan diteruskan ke Owner. Terima kasih atas kontribusinya!'
    );
  },
});
