const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { awardXp } = require('../../features/games/xp.engine');
const { getSenderJid } = require('../../utils/message.utils');

module.exports = createCommand({
  name: 'dadu',
  aliases: ['dice'],
  description: 'Lempar dadu melawan bot.',
  execute: async (client, message) => {
    const sender = getSenderJid(message);
    const userRoll = Math.floor(Math.random() * 6) + 1;
    const botRoll = Math.floor(Math.random() * 6) + 1;

    if (userRoll > botRoll) {
      await awardXp(sender, 'win');
    } else if (userRoll < botRoll) {
      await awardXp(sender, 'lose');
    } else {
      await awardXp(sender, 'draw');
    }

    await replyText(client, message, messages.games.random.dadu(userRoll, botRoll));
    return true;
  },
});
