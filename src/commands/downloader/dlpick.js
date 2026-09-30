const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { handleDownloadSelection } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'dlpick',
  aliases: ['downloadpick', 'pilihdl'],
  description: 'Pilih media yang akan diunduh dari daftar opsi.',
  isFree: true,
  execute: async (client, message, args = []) => {
    const cacheId = args[0]?.trim();
    const indexStr = args[1]?.trim();

    if (!cacheId || !indexStr) {
      await replyText(
        client,
        message,
        'Format: ```.dlpick <id> <nomor>```\nContoh: ```.dlpick a1b2c3 1```'
      );
      return true;
    }

    const index = parseInt(indexStr, 10) - 1; // 1-based user input
    return handleDownloadSelection(client, message, cacheId, index);
  },
});
