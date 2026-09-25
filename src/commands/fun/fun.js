const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { sendNativeFlow } = require('../../utils/interactive');
const { getMainMenuSection, getFiturBotSection } = require('../../features/menu/menu.builder');
const cekCommands = require('./cek.commands');

module.exports = createCommand({
  name: 'fun',
  aliases: [],
  description: 'Tampilkan menu fun',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    try {
      const names = Array.isArray(cekCommands)
        ? cekCommands.map((c) => c.name).filter(Boolean)
        : [];
      const text = messages.fun.buildFunMenu(names);

      const sections = [
        {
          title: 'FUN & JOKES (KOMPLIT)',
          rows: [
            { id: '.cekfemboy', title: '.cekfemboy', description: 'Cek level femboy' },
            { id: '.cekbeban', title: '.cekbeban', description: 'Cek tingkat beban grup' },
            { id: '.cektampan', title: '.cektampan', description: 'Cek tingkat ketampanan' },
            { id: '.cekcantik', title: '.cekcantik', description: 'Cek tingkat kecantikan' },
            { id: '.cekjodoh', title: '.cekjodoh', description: 'Cek kecocokan jodoh' },
            { id: '.cekhargadiri', title: '.cekhargadiri', description: 'Cek estimasi harga diri' },
            { id: '.cekcocok', title: '.cekcocok', description: 'Cek kecocokan antar member' },
            { id: '.cekchemistry', title: '.cekchemistry', description: 'Cek chemistry pasangan' },
            { id: '.ceklove', title: '.ceklove', description: 'Cek persentase cinta' },
            { id: '.cektoxic', title: '.cektoxic', description: 'Cek kadar toxic seseorang' },
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
        title: 'FUN & JOKES',
        body: text,
        sections,
      });

      return true;
    } catch (err) {
      console.error('[FUN] Menu error:', err);
      await replyText(client, message, 'Gagal menampilkan menu fun.');
      return false;
    }
  },
});
