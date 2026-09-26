const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const dataLoader = require('../../features/games/data.loader');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'tebaklagu',
  aliases: ['lagu'],
  description: 'Tebak judul lagu dari potongan audio.',
  limitCost: 1,
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const items = dataLoader.getTebakLagu();
    if (!items.length) {
      await replyText(client, message, 'Data tebak lagu belum tersedia.');
      return true;
    }

    const item = items[Math.floor(Math.random() * items.length)];
    const timeSec = 45;
    const answer = (item.judul || '').trim().toLowerCase();

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(client, message, messages.games.quiz.timeout(item.judul));
    }, timeSec * 1000);

    setSession(jid, {
      type: 'tebaklagu',
      timer,
      onAnswer: async (senderJid, text) => {
        const clean = text.trim().toLowerCase();
        if (clean === answer || clean.includes(answer) || answer.includes(clean)) {
          clearTimeout(timer);
          deleteSession(jid);
          const xpRes = await awardXp(senderJid, 'correct_quiz');
          const winnerTag = `@${senderJid.split('@')[0]}`;
          await replyText(
            client,
            message,
            messages.games.quiz.correct({
              winner: winnerTag,
              answer: `${item.judul} (${item.artis || ''})`,
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

    const caption = messages.games.tebakLagu.start({ artis: item.artis, timeSec });

    try {
      if (item.lagu) {
        await client.sendMessage(
          jid,
          { audio: { url: item.lagu }, mimetype: 'audio/mp4', ptt: true },
          { quoted: message }
        );
        await replyText(client, message, caption);
      } else {
        await replyText(client, message, caption);
      }
    } catch (sendErr) {
      console.warn('[TEBAKLAGU] Audio send error, text fallback:', sendErr?.message || sendErr);
      await replyText(client, message, caption);
    }

    return true;
  },
});
