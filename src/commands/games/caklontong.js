const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getCakLontong, pickRandom } = require('../../features/games/data.loader');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'caklontong',
  aliases: ['lontong'],
  description: 'Teka-teki lucu ala Cak Lontong.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const data = getCakLontong();
    const item = pickRandom(data);
    if (!item) {
      await replyText(client, message, 'Gagal memuat soal cak lontong.');
      return false;
    }

    const answer = String(item.jawaban || '').trim().toUpperCase();
    const timeSec = 40;

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(
        client,
        message,
        messages.games.quiz.timeout(`${answer}\n*Alasan:* ${item.deskripsi || '-'}`)
      );
    }, timeSec * 1000);

    setSession(jid, {
      type: 'caklontong',
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

    await replyText(client, message, messages.games.cakLontong.start({ soal: item.soal, timeSec }));
    return true;
  },
});
