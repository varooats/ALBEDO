const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'bandcamp',
  aliases: [],
  description: 'Unduh track atau album dari Bandcamp.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Bandcamp',
      command: 'bandcamp',
      example: 'https://....bandcamp.com/track/...',
    }),
});
