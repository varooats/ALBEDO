const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'navertv',
  aliases: ['naver'],
  description: 'Unduh video dari Naver TV.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Naver TV',
      command: 'navertv',
      example: 'https://tv.naver.com/v/...',
    }),
});
