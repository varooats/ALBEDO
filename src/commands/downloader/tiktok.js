const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'tiktok',
  aliases: ['tt', 'ttdl', 'tiktokdl'],
  description: 'Unduh video TikTok tanpa watermark.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'TikTok',
      command: 'tiktok',
      example: 'https://vt.tiktok.com/...',
    }),
});
