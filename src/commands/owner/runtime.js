const { createCommand } = require('../../core/command.factory');
const { sendInfoReply } = require('../../utils/interactive');

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (secs || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = createCommand({
  name: 'runtime',
  aliases: ['uptime', 'lamabot'],
  description: 'Menampilkan berapa lama bot sudah online.',
  execute: (client, message) =>
    sendInfoReply(client, message, 'runtime', { uptime: formatDuration(process.uptime()) }),
});
