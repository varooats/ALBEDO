const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'facebook',
  aliases: ['fb', 'fbdl'],
  description: 'Unduh video dari Facebook.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Facebook',
      command: 'facebook',
      example: 'https://www.facebook.com/reel/...',
    }),
});
