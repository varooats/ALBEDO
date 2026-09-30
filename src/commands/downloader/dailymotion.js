const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'dailymotion',
  aliases: ['dm'],
  description: 'Unduh video dari Dailymotion.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Dailymotion',
      command: 'dailymotion',
      example: 'https://www.dailymotion.com/video/...',
    }),
});
