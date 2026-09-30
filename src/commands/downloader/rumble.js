const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'rumble',
  aliases: [],
  description: 'Unduh video dari Rumble.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Rumble',
      command: 'rumble',
      example: 'https://rumble.com/...',
    }),
});
