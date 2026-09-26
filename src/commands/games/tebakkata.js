const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getTebakKata, pickRandom } = require('../../features/games/data.loader');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'tebakkata',
  description: 'Tebak kata berdasarkan clue.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const data = getTebakKata();
    const item = pickRandom(data);
    if (!item) {
      await replyText(client, message, 'Gagal memuat soal tebak kata.');
      return false;
    }

    const clue = item.soal || item.clue;
    const answer = String(item.jawaban || item.answer || '').trim().toUpperCase();
    const timeSec = 30;

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(client, message, messages.games.quiz.timeout(answer));
    }, timeSec * 1000);

    setSession(jid, {
      type: 'tebakkata',
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
            messages.games.quiz.correct({
              winner: winnerTag,
              answer,
              xp: 10,
              leveledUp: xpRes?.leveledUp,
              newLevel: xpRes?.newLevel,
            }),
            { mentions: [senderJid] }
          );
          return true;
        }
        return false;
      },
    });

    await replyText(client, message, messages.games.tebakKata.start({ clue, timeSec }));
    return true;
  },
});
