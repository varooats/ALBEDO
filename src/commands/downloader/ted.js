const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'ted',
  aliases: [],
  description: 'Unduh video presentasi dari TED Talks.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'TED',
      command: 'ted',
      example: 'https://www.ted.com/talks/...',
    }),
});
