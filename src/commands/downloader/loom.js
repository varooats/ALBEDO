const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'loom',
  aliases: [],
  description: 'Unduh video screen recording dari Loom.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Loom',
      command: 'loom',
      example: 'https://www.loom.com/share/...',
    }),
});
