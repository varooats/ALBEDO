const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'instagram',
  aliases: ['ig', 'igdl', 'reel', 'reels'],
  description: 'Unduh video Reels / Post feed Instagram.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Instagram',
      command: 'instagram',
      example: 'https://www.instagram.com/reel/...',
    }),
});
