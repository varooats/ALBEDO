const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'bilibili',
  aliases: ['bili'],
  description: 'Unduh video dari Bilibili.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Bilibili',
      command: 'bilibili',
      example: 'https://www.bilibili.tv/id/video/...',
    }),
});
