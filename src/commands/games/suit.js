const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { resolveMentionJids, getSenderJid } = require('../../utils/message.utils');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

const CHOICES = ['batu', 'gunting', 'kertas'];

function determineSuitWinner(c1, c2) {
  if (c1 === c2) return 'draw';
  if (
    (c1 === 'batu' && c2 === 'gunting') ||
    (c1 === 'gunting' && c2 === 'kertas') ||
    (c1 === 'kertas' && c2 === 'batu')
  ) {
    return 'p1';
  }
  return 'p2';
}

module.exports = createCommand({
  name: 'suit',
  description: 'Main suit batu gunting kertas melawan bot atau user.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const sender = getSenderJid(message);
    const mentions = resolveMentionJids(message);
    const opponent = mentions[0] || null;

    // Solo mode against bot if no opponent or quick choice provided
    const userChoice = args[0]?.toLowerCase();
    if (!opponent && CHOICES.includes(userChoice)) {
      const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
      const result = determineSuitWinner(userChoice, botChoice);

      let winnerText;
      if (result === 'draw') {
        winnerText = 'draw';
        await awardXp(sender, 'draw');
      } else if (result === 'p1') {
        winnerText = `@${sender.split('@')[0]}`;
        await awardXp(sender, 'win');
      } else {
        winnerText = 'Albedo Bot';
        await awardXp(sender, 'lose');
      }

      await replyText(
        client,
        message,
        messages.games.battle.suitResult({
          p1: `@${sender.split('@')[0]}`,
          p2: 'Albedo Bot',
          choice1: userChoice,
          choice2: botChoice,
          winner: winnerText,
        }),
        { mentions: [sender] }
      );
      return true;
    }

    // 2-player mode
    if (opponent) {
      if (hasSession(jid)) {
        await replyText(client, message, messages.games.quiz.alreadyActive);
        return true;
      }

      const p1Tag = `@${sender.split('@')[0]}`;
      const p2Tag = `@${opponent.split('@')[0]}`;

      const session = {
        type: 'suit',
        p1: sender,
        p2: opponent,
        c1: null,
        c2: null,
        timer: setTimeout(async () => {
          deleteSession(jid);
          await replyText(client, message, '⏰ Waktu suit habis! Pertandingan dibatalkan.');
        }, 60 * 1000),
        onChoice: async (playerJid, choice) => {
          if (!CHOICES.includes(choice)) return false;
          if (playerJid === session.p1) session.c1 = choice;
          if (playerJid === session.p2) session.c2 = choice;

          if (session.c1 && session.c2) {
            clearTimeout(session.timer);
            deleteSession(jid);
            const winner = determineSuitWinner(session.c1, session.c2);

            let winName = 'draw';
            if (winner === 'p1') {
              winName = p1Tag;
              await awardXp(session.p1, 'win');
              await awardXp(session.p2, 'lose');
            } else if (winner === 'p2') {
              winName = p2Tag;
              await awardXp(session.p2, 'win');
              await awardXp(session.p1, 'lose');
            } else {
              await awardXp(session.p1, 'draw');
              await awardXp(session.p2, 'draw');
            }

            await replyText(
              client,
              message,
              messages.games.battle.suitResult({
                p1: p1Tag,
                p2: p2Tag,
                choice1: session.c1,
                choice2: session.c2,
                winner: winName,
              }),
              { mentions: [session.p1, session.p2] }
            );
            return true;
          }
          return true;
        },
      };

      setSession(jid, session);
      await replyText(
        client,
        message,
        messages.games.battle.suitStart({ p1: p1Tag, p2: p2Tag }),
        { mentions: [sender, opponent] }
      );
      return true;
    }

    // Default usage
    await replyText(
      client,
      message,
      'Gunakan: ```.suit batu / gunting / kertas``` (vs Bot)\natau ```.suit @user``` (Duel 2 Pemain)'
    );
    return true;
  },
});
