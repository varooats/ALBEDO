const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'tebakangka',
  description: 'Tebak angka rahasia antara 1 - 100.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const secret = Math.floor(Math.random() * 100) + 1;
    const timeSec = 45;

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(client, message, `⏰ Waktu tebak angka habis! Angkanya adalah *${secret}*.`);
    }, timeSec * 1000);

    setSession(jid, {
      type: 'tebakangka',
      secret,
      timer,
      onAnswer: async (senderJid, text) => {
        const guess = parseInt(text.trim(), 10);
        if (isNaN(guess)) return false;

        if (guess === secret) {
          clearTimeout(timer);
          deleteSession(jid);
          const xpRes = await awardXp(senderJid, 'correct_quiz');
          const name = xpRes?.user?.name || `@${senderJid.split('@')[0]}`;
          await replyText(
            client,
            message,
            `🎉 *TEBAKAN TEPAT!*\n\nPemenang: ${name}\nAngka rahasia: *${secret}*\nReward: *+10 XP*`
          );
          return true;
        }

        if (guess < secret) {
          await replyText(client, message, `Tebakan *${guess}* terlalu *KECIL*! Coba angka lebih besar.`);
        } else {
          await replyText(client, message, `Tebakan *${guess}* terlalu *BESAR*! Coba angka lebih kecil.`);
        }
        return false;
      },
    });

    await replyText(
      client,
      message,
      '╭─『 🔢 TEBAK ANGKA 』\n│\n│ ⟢ Tebak angka antara 1 - 100\n│ ⏱️ Batas waktu : 45 detik\n│\n╰──────────────────\n> Ketik angka tebakanmu langsung di chat!'
    );
    return true;
  },
});
