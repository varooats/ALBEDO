const { createCommand } = require('../../core/command.factory');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

module.exports = createCommand({
  name: 'twitch',
  aliases: [],
  description: 'Unduh klip atau VOD dari Twitch.',
  execute: (client, message, args = []) =>
    handlePlatformDownload(client, message, args, {
      platform: 'Twitch',
      command: 'twitch',
      example: 'https://clips.twitch.tv/...',
    }),
});
