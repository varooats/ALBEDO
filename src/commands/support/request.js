const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');
const { replyText } = require('../../core/reply');
const { getSenderJid } = require('../../utils/message');
const { sendTicketToOwners } = require('../../services/support/support.service');

module.exports = createCommand({
  name: 'request',
  aliases: ['minta', 'requestfitur', 'req'],
  category: 'support',
  description: 'Request fitur baru untuk bot.',
  execute: async (client, message, args = []) => {
    const content = args.join(' ').trim();
    if (!content) {
      return sendInfoReply(client, message, 'request');
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
      type: 'request',
      senderJid,
      groupJid,
      groupName,
      content,
    });

    return replyText(
      client,
      message,
      '💡 *REQUEST FITUR TERKIRIM*\n\nIde fitur kamu telah diteruskan ke tim Developer & Owner bot. Terima kasih!'
    );
  },
});
