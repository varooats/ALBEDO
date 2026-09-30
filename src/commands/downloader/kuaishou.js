const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'kuaishou',
  aliases: ['kwai'],
  description: 'Unduh video dari Kuaishou / Kwai.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Kuaishou',
      command: 'kuaishou',
      example: 'https://v.kuaishou.com/...',
    }),
});
