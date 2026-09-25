const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getLeaderboard } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  description: 'Papan peringkat user dengan XP tertinggi.',
  execute: async (client, message) => {
    try {
      const topList = await getLeaderboard(10);
      if (!topList.length) {
        await replyText(client, message, 'Belum ada data di leaderboard.');
        return true;
      }

      await replyText(client, message, messages.games.system.leaderboard(topList));
      return true;
    } catch (e) {
      console.error('[LEADERBOARD] Error:', e);
      await replyText(client, message, 'Gagal memuat leaderboard.');
      return false;
    }
  },
});
