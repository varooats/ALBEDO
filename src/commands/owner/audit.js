const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { getAuditLogs, formatAuditLogs } = require('../../services/audit/audit.service');

module.exports = createCommand({
  name: 'audit',
  permission: 'ADMIN',
  category: 'owner',
  description: 'Lihat audit log aktivitas penting bot.',
  execute: async (client, message, args) => {
    const filter = String(args[0] || '').toLowerCase().trim();

    let logs;
    if (filter === 'group') {
      logs = getAuditLogs('GROUP');
    } else if (filter === 'user') {
      logs = getAuditLogs('USER');
    } else if (filter === 'security') {
      logs = getAuditLogs('SECURITY');
    } else if (filter === 'settings' || filter === 'setting') {
      logs = getAuditLogs('SETTINGS');
    } else if (filter === 'owner') {
      logs = getAuditLogs('OWNER');
    } else {
      logs = getAuditLogs(null, 15);
    }

    const output = formatAuditLogs(logs);
    return replyText(client, message, output);
  },
});
