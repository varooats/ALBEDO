const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'twitter',
  aliases: ['x', 'twit', 'xdl', 'twt'],
  description: 'Unduh video, GIF, atau foto dari X (Twitter).',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Twitter / X',
      command: 'twitter',
      example: 'https://x.com/user/status/...',
    }),
});
