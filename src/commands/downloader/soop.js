const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'soop',
  aliases: [],
  description: 'Unduh video atau klip dari SOOP (AfreecaTV).',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'SOOP',
      command: 'soop',
      example: 'https://vod.sooplive.co.kr/...',
    }),
});
