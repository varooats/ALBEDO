const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'streamable',
  aliases: [],
  description: 'Unduh video dari Streamable.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Streamable',
      command: 'streamable',
      example: 'https://streamable.com/...',
    }),
});
