const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'mixcloud',
  aliases: [],
  description: 'Unduh DJ mix atau audio dari Mixcloud.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Mixcloud',
      command: 'mixcloud',
      example: 'https://www.mixcloud.com/.../.../',
    }),
});
