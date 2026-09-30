const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'vimeo',
  aliases: [],
  description: 'Unduh video dari Vimeo.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Vimeo',
      command: 'vimeo',
      example: 'https://vimeo.com/...',
    }),
});
