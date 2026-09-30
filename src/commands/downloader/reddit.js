const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'reddit',
  aliases: ['rd'],
  description: 'Unduh video, audio, atau foto dari Reddit.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Reddit',
      command: 'reddit',
      example: 'https://www.reddit.com/r/.../comments/...',
    }),
});
