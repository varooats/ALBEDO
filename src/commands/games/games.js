const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { sendNativeFlow } = require('../../utils/interactive');
const { getMainMenuSection, getFiturBotSection } = require('../../features/menu/menu.builder');

module.exports = createCommand({
  name: 'games',
  aliases: ['game', 'gamemenu'],
  description: 'Menu fitur games.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    try {
      const sections = [
        {
          title: 'GAMES COMMANDS (LENGKAP)',
          rows: [
            { id: '.quiz', title: '.quiz', description: 'Kuis pilihan ganda asah otak' },
            { id: '.tebakgambar', title: '.tebakgambar', description: 'Tebak makna susunan gambar' },
            { id: '.tebakkata', title: '.tebakkata', description: 'Tebak kata berdasarkan petunjuk' },
            { id: '.tebakbendera', title: '.tebakbendera', description: 'Tebak bendera negara dunia' },
            { id: '.tebaklagu', title: '.tebaklagu', description: 'Tebak judul cuplikan lagu' },
            { id: '.caklontong', title: '.caklontong', description: 'Kuis nyeleneh ala Cak Lontong' },
            { id: '.siapakahaku', title: '.siapakahaku', description: 'Tebak objek dari teka-teki' },
            { id: '.asahotak', title: '.asahotak', description: 'Tantangan logika asah otak' },
            { id: '.susunkata', title: '.susunkata', description: 'Susun huruf acak menjadi kata' },
            { id: '.tictactoe', title: '.tictactoe', description: 'Main Tic-Tac-Toe bersama teman' },
            { id: '.suit', title: '.suit', description: 'Suit batu-gunting-kertas' },
            { id: '.dadu', title: '.dadu', description: 'Lempar dadu keberuntungan' },
            { id: '.slot', title: '.slot', description: 'Mesin slot keberuntungan EXP' },
            { id: '.coinflip', title: '.coinflip', description: 'Tebak sisi koin Gambar/Angka' },
            { id: '.roulette', title: '.roulette', description: 'Permainan russian roulette' },
            { id: '.score', title: '.score', description: 'Cek statistik level & EXP kamu' },
            { id: '.leaderboard', title: '.leaderboard', description: 'Papan peringkat top EXP' },
            { id: '.daily', title: '.daily', description: 'Klaim hadiah EXP harian' },
          ],
        },
      ];

      const mainMenuSection = getMainMenuSection();
      if (mainMenuSection) {
        sections.push(mainMenuSection);
      }

      const fiturBotSection = getFiturBotSection();
      if (fiturBotSection) {
        sections.push(fiturBotSection);
      }

      await sendNativeFlow(client, jid, message, {
        title: 'GAMES CENTER',
        body: messages.games.menu,
        sections,
      });

      return true;
    } catch (err) {
      console.warn('[GAMES] Native flow failed, fallback to text:', err?.message || err);
      await replyText(client, message, messages.games.menu);
      return true;
    }
  },
});
