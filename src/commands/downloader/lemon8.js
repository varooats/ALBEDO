const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'lemon8',
  aliases: [],
  description: 'Unduh video atau foto album dari Lemon8.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Lemon8',
      command: 'lemon8',
      example: 'https://v.lemon8-app.com/...',
    }),
});
