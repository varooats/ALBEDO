const { createCommand } = require('../../core/command.factory');
const { replyText, replyImage } = require('../../core/reply');
const { messages } = require('../../messages');
const { getTebakGambar, pickRandom } = require('../../features/games/data.loader');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'tebakgambar',
  description: 'Tebak gambar dari potongan petunjuk visual.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const data = getTebakGambar();
    const item = pickRandom(data);
    if (!item?.img) {
      await replyText(client, message, 'Gagal memuat soal tebak gambar.');
      return false;
    }

    const answer = String(item.jawaban || '').trim().toUpperCase();
    const timeSec = 45;

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(
        client,
        message,
        messages.games.quiz.timeout(`${answer} (${item.deskripsi || ''})`)
      );
    }, timeSec * 1000);

    setSession(jid, {
      type: 'tebakgambar',
      answer,
      timer,
      onAnswer: async (senderJid, text) => {
        const clean = text.trim().toUpperCase();
        if (clean === answer) {
          clearTimeout(timer);
          deleteSession(jid);
          const xpRes = await awardXp(senderJid, 'correct_quiz');
          const winnerTag = `@${senderJid.split('@')[0]}`;
          await replyText(
            client,
            message,
            messages.games.tebakGambar.answerWithDesc({
              winner: winnerTag,
              answer,
              deskripsi: item.deskripsi,
              xp: 10,
            }),
            { mentions: [senderJid] }
          );
          return true;
        }
        return false;
      },
    });

    const caption = messages.games.tebakGambar.start({ timeSec });
    await replyImage(client, message, item.img, caption);
    return true;
  },
});
