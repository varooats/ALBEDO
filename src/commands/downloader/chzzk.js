const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'chzzk',
  aliases: [],
  description: 'Unduh klip atau siaran dari CHZZK.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'CHZZK',
      command: 'chzzk',
      example: 'https://chzzk.naver.com/video/...',
    }),
});
