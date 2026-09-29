const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { getSenderJid } = require('../../utils/message');
const { getUserPrivacy, setUserPrivacy, formatPrivacyCard } = require('../../services/user/privacy.service');

module.exports = createCommand({
  name: 'privacy',
  aliases: ['privasi'],
  category: 'general',
  description: 'Atur privasi profil dan statistik akun.',
  execute: async (client, message, args = []) => {
    const senderJid = getSenderJid(message);
    if (!senderJid) return false;

    const field = String(args[0] || '').toLowerCase().trim();
    const value = String(args[1] || '').toLowerCase().trim();

    if (!field) {
      const privacy = await getUserPrivacy(senderJid);
      return replyText(client, message, formatPrivacyCard(privacy));
    }

    if (!['profile', 'stats', 'history'].includes(field)) {
      return replyText(client, message, 'Field tidak valid. Pilihan: `profile`, `stats`, `history`.\nContoh: `.privacy profile private`');
    }

    if (!['public', 'private'].includes(value)) {
      return replyText(client, message, `Nilai harus \`public\` atau \`private\`.\nContoh: \`.privacy ${field} private\``);
    }

    try {
      const updated = await setUserPrivacy(senderJid, field, value);
      return replyText(
        client,
        message,
        `✅ Privasi *${field}* berhasil diubah menjadi *${value.toUpperCase()}*.\n\n${formatPrivacyCard(updated)}`
      );
    } catch (err) {
      return replyText(client, message, `Gagal mengubah privasi: ${err.message}`);
    }
  },
});
