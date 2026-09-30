const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'douyin',
  aliases: [],
  description: 'Unduh video HD tanpa watermark dari Douyin (抖音).',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Douyin',
      command: 'douyin',
      example: 'https://v.douyin.com/.../',
    }),
});
