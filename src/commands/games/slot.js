const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { awardXp } = require('../../features/games/xp.engine');
const { getSenderJid } = require('../../utils/message');

const ICONS = ['🍎', '🍒', '🍋', '💎', '7️⃣', '🔔'];

module.exports = createCommand({
  name: 'slot',
  aliases: ['spin'],
  description: 'Main mesin slot keberuntungan.',
  execute: async (client, message) => {
    const sender = getSenderJid(message);

    const s1 = ICONS[Math.floor(Math.random() * ICONS.length)];
    const s2 = ICONS[Math.floor(Math.random() * ICONS.length)];
    const s3 = ICONS[Math.floor(Math.random() * ICONS.length)];

    const isJackpot = s1 === s2 && s2 === s3;
    const isPair = s1 === s2 || s2 === s3 || s1 === s3;

    let xpGained = 0;
    if (isJackpot) {
      xpGained = 50;
      await awardXp(sender, 'win');
    } else if (isPair) {
      xpGained = 10;
      await awardXp(sender, 'correct_quiz');
    } else {
      await awardXp(sender, 'lose');
    }

    await replyText(
      client,
      message,
      messages.games.random.slot([s1, s2, s3], isJackpot || isPair, xpGained)
    );
    return true;
  },
});
