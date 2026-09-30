const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'vk',
  aliases: [],
  description: 'Unduh video atau klip dari VKontakte (VK).',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'VK',
      command: 'vk',
      example: 'https://vk.com/video...',
    }),
});
