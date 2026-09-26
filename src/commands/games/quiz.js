const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { QUIZ_BANK, pickRandom, formatQuizChoices } = require('../../features/games/quiz.bank');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');
const { resolveJid } = require('../../utils/message');

module.exports = createCommand({
  name: 'quiz',
  aliases: ['kuis'],
  description: 'Mulai permainan kuis interaktif.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const item = pickRandom(QUIZ_BANK);
    const choices = formatQuizChoices(item.o);
    const timeSec = 30;

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(client, message, messages.games.quiz.timeout(item.a));
    }, timeSec * 1000);

    setSession(jid, {
      type: 'quiz',
      answer: item.a,
      timer,
      onAnswer: async (senderJid, text) => {
        const clean = text.trim().toUpperCase();
        if (clean === item.a) {
          clearTimeout(timer);
          deleteSession(jid);
          const xpRes = await awardXp(senderJid, 'correct_quiz');
          const winnerTag = `@${senderJid.split('@')[0]}`;
          await replyText(
            client,
            message,
            messages.games.quiz.correct({
              winner: winnerTag,
              answer: item.a,
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

    await replyText(client, message, messages.games.quiz.start({ q: item.q, choices, timeSec }));
    return true;
  },
});
