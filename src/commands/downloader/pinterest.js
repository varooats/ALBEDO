const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'pinterest',
  aliases: ['pin', 'pindl'],
  description: 'Unduh video, foto, atau GIF dari Pinterest.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Pinterest',
      command: 'pinterest',
      example: 'https://pin.it/...',
    }),
});
