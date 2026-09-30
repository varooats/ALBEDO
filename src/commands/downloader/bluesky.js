const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'bluesky',
  aliases: ['bsky'],
  description: 'Unduh video, GIF, atau gambar dari Bluesky.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Bluesky',
      command: 'bluesky',
      example: 'https://bsky.app/profile/.../post/...',
    }),
});
