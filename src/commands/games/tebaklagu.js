const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getTebakLagu, pickRandom } = require('../../features/games/data.loader');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'tebaklagu',
  description: 'Tebak judul lagu dari cuplikan audio.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const data = getTebakLagu();
    const item = pickRandom(data);
    if (!item?.judul) {
      await replyText(client, message, 'Gagal memuat soal tebak lagu.');
      return false;
    }

    const answer = String(item.judul).trim().toUpperCase();
    const timeSec = 45;

    const timer = setTimeout(async () => {
      deleteSession(jid);
      await replyText(
        client,
        message,
        messages.games.quiz.timeout(`${item.judul} - ${item.artis || ''}`)
      );
    }, timeSec * 1000);

    setSession(jid, {
      type: 'tebaklagu',
      answer,
      timer,
      onAnswer: async (senderJid, text) => {
        const clean = text.trim().toUpperCase();
        if (clean === answer || clean.includes(answer) || answer.includes(clean)) {
          clearTimeout(timer);
          deleteSession(jid);
          const xpRes = await awardXp(senderJid, 'correct_quiz');
          const name = xpRes?.user?.name || `@${senderJid.split('@')[0]}`;
          await replyText(
            client,
            message,
            messages.games.quiz.correct({
              winner: name,
              answer: `${item.judul} (${item.artis || ''})`,
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

    const caption = messages.games.tebakLagu.start({ artis: item.artis, timeSec });

    try {
      if (item.lagu) {
        await client.sendMessage(
          jid,
          { audio: { url: item.lagu }, mimetype: 'audio/mp4', ptt: true },
          { quoted: message }
        );
      }
      await replyText(client, message, caption);
    } catch (sendErr) {
      console.warn('[TEBAKLAGU] Audio send error, text fallback:', sendErr?.message || sendErr);
      await replyText(client, message, caption);
    }

    return true;
  },
});
