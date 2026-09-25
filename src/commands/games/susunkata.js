const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getSusunKata, pickRandom } = require('../../features/games/data.loader');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'susunkata',
  aliases: ['acakakata'],
  description: 'Susun huruf acak menjadi kata yang benar.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const data = getSusunKata();
    const item = pickRandom(data);
    if (!item) {
      await replyText(client, message, 'Gagal memuat soal susun kata.');
      return false;
    }

    const scrambled = item.soal || item.word;
    const clue = item.tipe || item.clue || 'Kata Umum';
    const answer = String(item.jawaban || item.answer || '').trim().toUpperCase();
    const timeSec = 30;

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(client, message, messages.games.quiz.timeout(answer));
    }, timeSec * 1000);

    setSession(jid, {
      type: 'susunkata',
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

    await replyText(
      client,
      message,
      messages.games.susunKata.start({ scrambled, clue, timeSec })
    );
    return true;
  },
});
