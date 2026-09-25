const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { awardXp } = require('../../features/games/xp.engine');
const { getSenderJid } = require('../../utils/message.utils');

module.exports = createCommand({
  name: 'coinflip',
  aliases: ['koin', 'flip'],
  description: 'Tebak koin angka atau gambar.',
  execute: async (client, message, args = []) => {
    const sender = getSenderJid(message);
    const pick = args[0]?.toLowerCase();

    if (!pick || (!['angka', 'gambar'].includes(pick))) {
      await replyText(client, message, 'Gunakan: ```.coinflip angka``` atau ```.coinflip gambar```');
      return true;
    }

    const sides = ['angka', 'gambar'];
    const result = sides[Math.floor(Math.random() * sides.length)];
    const win = pick === result;

    if (win) {
      await awardXp(sender, 'correct_quiz');
    } else {
      await awardXp(sender, 'lose');
    }

    await replyText(client, message, messages.games.random.coinflip(pick, result, win));
    return true;
  },
});
