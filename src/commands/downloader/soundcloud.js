const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'soundcloud',
  aliases: ['sc', 'scdl'],
  description: 'Unduh track atau musik dari SoundCloud.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'SoundCloud',
      command: 'soundcloud',
      example: 'https://soundcloud.com/.../...',
    }),
});
