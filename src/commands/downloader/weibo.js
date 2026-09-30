const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'weibo',
  aliases: [],
  description: 'Unduh video atau foto album dari Weibo.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Weibo',
      command: 'weibo',
      example: 'https://weibo.com/.../...',
    }),
});
