const { createCommand } = require('../../core/command.factory');
const config = require('../../config/bot.config');
const { sendInfoReply } = require('../../utils/interactive');

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(2)} ${sizes[i]}`;
}

module.exports = createCommand({
  name: 'status',
  aliases: ['botstatus', 'serverstatus'],
  description: 'Status bot/server.',
  execute: (client, message) => {
    const memory = process.memoryUsage();
    const uptime = Math.floor(process.uptime());
    const uptimeStr = `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
    const memStr = `${formatBytes(memory.heapUsed)} / ${formatBytes(memory.heapTotal)}`;

    return sendInfoReply(client, message, 'status', {
      config,
      uptime: uptimeStr,
      memory: memStr,
      nodeVersion: process.version,
      platform: process.platform,
    });
  },
});
