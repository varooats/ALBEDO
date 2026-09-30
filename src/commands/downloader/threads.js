const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'threads',
  aliases: ['thread'],
  description: 'Unduh video atau foto dari Threads.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Threads',
      command: 'threads',
      example: 'https://www.threads.com/@user/post/...',
    }),
});
