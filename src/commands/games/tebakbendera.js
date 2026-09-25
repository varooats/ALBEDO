const { createCommand } = require('../../core/command.factory');
const { replyText, replyImage } = require('../../core/reply');
const { messages } = require('../../messages');
const { getTebakBendera, pickRandom } = require('../../features/games/data.loader');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'tebakbendera',
  aliases: ['bendera'],
  description: 'Tebak nama negara dari gambar bendera.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const data = getTebakBendera();
    const item = pickRandom(data);
    if (!item?.img) {
      await replyText(client, message, 'Gagal memuat soal tebak bendera.');
      return false;
    }

    const answer = String(item.name || '').trim().toUpperCase();
    const timeSec = 30;

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(client, message, messages.games.quiz.timeout(answer));
    }, timeSec * 1000);

    setSession(jid, {
      type: 'tebakbendera',
      answer,
      timer,
      onAnswer: async (senderJid, text) => {
        const clean = text.trim().toUpperCase();
        if (clean === answer) {
          clearTimeout(timer);
          deleteSession(jid);
          const xpRes = await awardXp(senderJid, 'correct_quiz');
          const name = xpRes?.user?.name || `@${senderJid.split('@')[0]}`;
          await replyText(
            client,
            message,
            messages.games.quiz.correct({
              winner: name,
              answer,
              xp: 10,
              leveledUp: xpRes?.leveledUp,
              newLevel: xpRes?.newLevel,
            })
          );
          return true;
        }
        return false;
      },
    });

    const caption = messages.games.tebakBendera.start({ timeSec });
    await replyImage(client, message, item.img, caption);
    return true;
  },
});
