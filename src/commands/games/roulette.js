const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { awardXp } = require('../../features/games/xp.engine');
const { getSenderJid } = require('../../utils/message');

module.exports = createCommand({
  name: 'roulette',
  description: 'Russian roulette menguji keberuntungan.',
  execute: async (client, message) => {
    const sender = getSenderJid(message);
    const bullets = Math.floor(Math.random() * 6) + 1;
    const trigger = Math.floor(Math.random() * 6) + 1;
    const died = bullets === trigger;

    if (died) {
      await awardXp(sender, 'lose');
    } else {
      await awardXp(sender, 'lose');
    }

    await replyText(client, message, messages.games.random.roulette(bullets, died));
    return true;
  },
});
