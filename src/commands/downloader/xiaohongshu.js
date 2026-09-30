const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'xiaohongshu',
  aliases: ['xhs'],
  description: 'Unduh video atau gambar dari Xiaohongshu (RED).',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Xiaohongshu',
      command: 'xiaohongshu',
      example: 'http://xhslink.com/...',
    }),
});
