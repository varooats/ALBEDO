const config = require('../../config/bot.config');
const { getOwners } = require('../owner/owner.service');
const { logAudit } = require('../audit/audit.service');
const { jidToMentionName } = require('../../utils/message');

const TYPE_LABELS = {
  report: '🚨 LAPORAN KENDALA',
  bug: '🐛 LAPORAN BUG / ERROR',
  feedback: '💬 KRITIK & SARAN',
  request: '💡 REQUEST FITUR',
};

async function sendTicketToOwners(client, { type = 'report', senderJid, groupJid, groupName, content }) {
  const label = TYPE_LABELS[type] || '📩 PESAN SUPPORT';
  const senderNumber = String(senderJid || '').replace(/\D/g, '');
  const senderMention = senderJid ? jidToMentionName(senderJid) : 'User';
  const origin = groupJid && groupJid.endsWith('@g.us')
    ? `Grup: *${groupName || groupJid}* (\`\`\`${groupJid}\`\`\`)`
    : 'Chat Pribadi (DM)';

  const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const ticketMessage = [
    `╭─〔 ${label} 〕`,
    '│',
    `│ Pengirim : ${senderMention} (+${senderNumber})`,
    `│ Asal     : ${origin}`,
    `│ Waktu    : ${timeStr} WIB`,
    '│',
    '│ Pesan:',
    `│ "${content}"`,
    '│',
    '╰──────────────────────────',
  ].join('\n');

  // Dapatkan daftar owner
  let owners = await getOwners();
  if (!owners.length && config.owner) {
    owners = [String(config.owner).replace(/\D/g, '')];
  }

  let sentCount = 0;
  for (const ownerNum of owners) {
    const ownerJid = `${ownerNum}@s.whatsapp.net`;
    try {
      await client.sendMessage(ownerJid, {
        text: ticketMessage,
        mentions: senderJid ? [senderJid] : [],
      });
      sentCount++;
    } catch (err) {
      console.warn(`[SUPPORT] Gagal forward ke owner ${ownerNum}:`, err.message);
    }
  }

  await logAudit('USER', `${type.toUpperCase()}: from ${senderNumber}`, { type, senderNumber, origin });
  return sentCount > 0;
}

module.exports = {
  TYPE_LABELS,
  sendTicketToOwners,
};
