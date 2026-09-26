const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getUserByJid, saveUser } = require('../../database/repositories/user.repository');
const { awardXp } = require('../../features/games/xp.engine');
const { getSenderJid } = require('../../utils/message');

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

module.exports = createCommand({
  name: 'daily',
  aliases: ['claim'],
  description: 'Klaim XP harian gratis.',
  execute: async (client, message) => {
    const sender = getSenderJid(message);
    if (!sender) return false;

    const user = await getUserByJid(sender);
    if (!user) {
      await replyText(client, message, 'Daftar terlebih dahulu dengan ```.register [nama]```.');
      return true;
    }

    const now = Date.now();
    const lastDaily = user.lastDaily ? new Date(user.lastDaily).getTime() : 0;
    const diff = now - lastDaily;

    if (diff < COOLDOWN_MS) {
      const remainingHours = Math.ceil((COOLDOWN_MS - diff) / (1000 * 60 * 60));
      await replyText(client, message, messages.games.system.dailyCooldown(remainingHours));
      return true;
    }

    user.lastDaily = new Date(now).toISOString();
    await saveUser(user);
    await awardXp(sender, 'daily');

    await replyText(client, message, messages.games.system.dailyClaimed(15));
    return true;
  },
});
