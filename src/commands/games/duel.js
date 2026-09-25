const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { resolveMentionJids, getSenderJid } = require('../../utils/message.utils');
const { awardXp } = require('../../features/games/xp.engine');

module.exports = createCommand({
  name: 'duel',
  aliases: ['fight'],
  description: 'Duel seru antar anggota grup.',
  execute: async (client, message) => {
    const sender = getSenderJid(message);
    const mentions = resolveMentionJids(message);
    const opponent = mentions[0] || null;

    if (!opponent || opponent === sender) {
      await replyText(client, message, 'Tag lawan yang ingin kamu tantang: ```.duel @user```');
      return true;
    }

    const p1Tag = `@${sender.split('@')[0]}`;
    const p2Tag = `@${opponent.split('@')[0]}`;

    const p1Atk = Math.floor(Math.random() * 50) + 50;
    const p2Atk = Math.floor(Math.random() * 50) + 50;

    let winner;
    let loser;
    let winTag;

    if (p1Atk >= p2Atk) {
      winner = sender;
      loser = opponent;
      winTag = p1Tag;
    } else {
      winner = opponent;
      loser = sender;
      winTag = p2Tag;
    }

    await awardXp(winner, 'win');
    await awardXp(loser, 'lose');

    const result = [
      '╭─『 ⚔️ DUEL ARENA 』',
      '│',
      `│ ⟢ ${p1Tag} : Power *${p1Atk}*`,
      `│ ⟢ ${p2Tag} : Power *${p2Atk}*`,
      '│',
      `│ 🏆 Pemenang : ${winTag} (+20 XP)`,
      '╰──────────────────',
      '> 「Kekuatan sejati terbukti dalam pertarungan!」',
    ].join('\n');

    await replyText(client, message, result, { mentions: [sender, opponent] });
    return true;
  },
});
