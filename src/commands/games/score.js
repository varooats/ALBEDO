const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getUserByJid } = require('../../database/repositories/user.repository');
const { getLeaderboard } = require('../../features/games/xp.engine');
const { getSenderJid, resolveMentionJids } = require('../../utils/message.utils');

module.exports = createCommand({
  name: 'score',
  aliases: ['rank', 'level'],
  description: 'Lihat statistik skor dan level pengguna.',
  execute: async (client, message) => {
    const mentions = resolveMentionJids(message);
    const targetJid = mentions[0] || getSenderJid(message);
    if (!targetJid) return false;

    const user = await getUserByJid(targetJid);
    if (!user) {
      await replyText(client, message, 'User belum terdaftar. Ketik ```.register``` terlebih dahulu.');
      return true;
    }

    let userRank = '-';
    try {
      const topList = await getLeaderboard(50);
      const found = topList.findIndex((u) => u.jid === targetJid);
      if (found !== -1) userRank = found + 1;
    } catch (e) {
      console.warn('[SCORE] Leaderboard rank error:', e.message);
    }

    await replyText(
      client,
      message,
      messages.games.system.score({
        name: `@${String(targetJid).split('@')[0]}`,
        exp: user.exp || 0,
        level: user.level || 1,
        rank: userRank,
      }),
      { mentions: [targetJid] }
    );
    return true;
  },
});
