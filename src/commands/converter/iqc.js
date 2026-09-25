const { createCommand } = require('../../core/command.factory');
const { replyImage, replyText } = require('../../core/reply');
const { getProfilePictureDataUri } = require('../../features/profile/profile.card');
const { generateIphoneNotificationCard } = require('../../features/converter/iqc.generator');
const { getUserByJid } = require('../../database/repositories/user.repository');
const {
  resolveJid,
  resolveMentionJids,
  sendReaction,
  sendTyping,
  REACTIONS,
} = require('../../utils/message.utils');

function parseIqcOptions(rawText) {
  let text = String(rawText || '').trim();
  let timeStr = null;
  let batteryPercent = 50;
  let carrier = 'Indosat Ooredoo';
  let senderCustomName = null;

  // 1. Check custom time flag: --time=HH:MM or --jam=HH:MM
  const timeMatch = text.match(/--(?:time|jam)=([0-2]?[0-9]:[0-5][0-9])/i);
  if (timeMatch) {
    timeStr = timeMatch[1];
    text = text.replace(timeMatch[0], '').trim();
  }

  // 2. Check custom battery flag: --bat=XX or --batre=XX or --battery=XX
  const batMatch = text.match(/--(?:bat|batre|battery)=(\d{1,3})/i);
  if (batMatch) {
    batteryPercent = Math.min(100, Math.max(1, parseInt(batMatch[1], 10)));
    text = text.replace(batMatch[0], '').trim();
  }

  // 3. Check custom carrier flag: --provider=X or --op=X or --kartu=X
  const carrierMatch = text.match(/--(?:provider|carrier|op|kartu)=([^ -]+(?:\s+[^ -]+)?)/i);
  if (carrierMatch) {
    carrier = carrierMatch[1].trim();
    text = text.replace(carrierMatch[0], '').trim();
  }

  // 4. Check custom sender name flag: --name=X or --dari=X
  const nameMatch = text.match(/--(?:name|dari|sender)=([^ -]+(?:\s+[^ -]+)?)/i);
  if (nameMatch) {
    senderCustomName = nameMatch[1].trim();
    text = text.replace(nameMatch[0], '').trim();
  }

  // Fallback to current device time if not specified
  if (!timeStr) {
    const now = new Date();
    // Use Western Indonesia Time (WIB) as standard or system time
    const hours = String((now.getUTCHours() + 7) % 24).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    timeStr = `${hours}:${minutes}`;
  }

  return {
    cleanText: text,
    timeStr,
    batteryPercent,
    carrier,
    senderCustomName,
  };
}

module.exports = createCommand({
  name: 'iqc',
  aliases: ['fakechat', 'iphonechat', 'qciphone', 'iphonelock'],
  description: 'Buat gambar mockup notifikasi iPhone lock screen.',
  limitCost: 1,
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    let input = args.join(' ').trim();
    const quotedText =
      message?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
      message?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
      '';

    if (!input && quotedText) {
      input = quotedText.trim();
    }

    if (!input) {
      await replyText(
        client,
        message,
        [
          '╭─『 📱 IPHONE NOTIFICATION (IQC) 』',
          '│ ⟢ ```.iqc <teks>```',
          '│ ⟢ ```.iqc <teks> --jam=19:24```',
          '│ ⟢ ```.iqc <teks> --batre=85```',
          '│ ⟢ ```.iqc <teks> --provider=Telkomsel```',
          '│ ⟢ ```.iqc <teks> --name="Alya"```',
          '╰──────────────────',
          '',
          '_Buat mockup notifikasi lock screen iPhone lengkap dengan Dynamic Island, jam, provider, dan baterai._',
          '',
          '> Contoh: ```.iqc sayang jangan lupa makan ya --jam=19:24 --batre=80 --provider=Telkomsel```',
        ].join('\n')
      );
      return true;
    }

    const { cleanText, timeStr, batteryPercent, carrier, senderCustomName } =
      parseIqcOptions(input);

    if (!cleanText) {
      await replyText(client, message, 'Teks pesan tidak boleh kosong.');
      return true;
    }

    await sendTyping(client, jid, 'composing');
    await sendReaction(client, message, REACTIONS.PROCESSING);

    try {
      const senderJid = resolveJid(message);
      const mentions = resolveMentionJids(message);
      const targetJid = mentions[0] || senderJid;

      // Fetch user profile name and avatar
      const user = await getUserByJid(targetJid);
      const pushName = message?.pushName || message?.key?.participant || 'User';
      const senderName =
        senderCustomName || user?.name || pushName.replace(/@.+/, '') || 'Albedo';

      let avatarDataUri = null;
      try {
        avatarDataUri = await getProfilePictureDataUri(client, targetJid);
      } catch (err) {
        console.warn('[IQC] Failed to load avatar:', err?.message || err);
      }

      const imageBuffer = await generateIphoneNotificationCard({
        text: cleanText,
        senderName,
        avatarDataUri,
        timeStr,
        batteryPercent,
        carrier,
        notifTime: 'now',
      });

      await replyImage(client, message, imageBuffer, '');
      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (error) {
      console.error('[IQC] Error generating iPhone notification:', error);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, 'Maaf, gagal membuat mockup iPhone lock screen. Silakan coba lagi.');
      return false;
    }
  },
});
