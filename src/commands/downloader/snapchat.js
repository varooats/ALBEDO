const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'snapchat',
  aliases: ['snap'],
  description: 'Unduh video Spotlight atau Story Snapchat.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Snapchat',
      command: 'snapchat',
      example: 'https://www.snapchat.com/spotlight/...',
    }),
});
