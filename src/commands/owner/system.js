const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { logAudit } = require('../../services/audit/audit.service');
const {
  setMaintenance,
  isMaintenanceActive,
  parseDuration,
} = require('../../services/system/system-control.service');

module.exports = [
  createCommand({
    name: 'shutdown',
    permission: 'SUPEROWNER',
    category: 'owner',
    description: 'Emergency shutdown bot atau shutdown sementara.',
    execute: async (client, message, args) => {
      const durationArg = args[0] ? String(args[0]).trim() : null;

      if (durationArg) {
        const ms = parseDuration(durationArg);
        if (!ms) {
          return replyText(client, message, 'Format durasi tidak valid. Contoh: `.shutdown 10m`, `.shutdown 1h`');
        }
        await setMaintenance(true, {
          reason: `Shutdown sementara (${durationArg})`,
          durationMs: ms,
          by: message?.key?.participant || 'superowner',
        });
        await logAudit('OWNER', `Emergency shutdown scheduled: ${durationArg}`);
        return replyText(
          client,
          message,
          `🛑 *EMERGENCY SHUTDOWN AKTIF*\n\nBot masuk mode maintenance selama ${durationArg} dan akan otomatis kembali aktif.`
        );
      }

      await logAudit('OWNER', 'Emergency shutdown executed');
      await replyText(client, message, '🛑 *EMERGENCY SHUTDOWN*\n\nBot dimatikan sepenuhnya oleh Superowner.');

      setTimeout(() => {
        try {
          if (client && typeof client.end === 'function') {
            client.end(new Error('Emergency shutdown by superowner'));
          }
        } catch {}
        process.exit(0);
      }, 1000);

      return true;
    },
  }),

  createCommand({
    name: 'maintenance',
    permission: 'OWNER',
    category: 'owner',
    description: 'Atur mode maintenance bot.',
    execute: async (client, message, args) => {
      const sub = String(args[0] || '').toLowerCase().trim();

      if (sub === 'on') {
        const durationStr = args[1] ? String(args[1]).trim() : null;
        const ms = durationStr ? parseDuration(durationStr) : null;
        await setMaintenance(true, {
          durationMs: ms,
          by: message?.key?.participant || 'owner',
        });
        return replyText(
          client,
          message,
          `🔧 Mode maintenance telah *DIAKTIFKAN*${durationStr ? ` selama ${durationStr}` : ''}.\nPengguna biasa tidak dapat menggunakan command.`
        );
      }

      if (sub === 'off') {
        await setMaintenance(false, { by: message?.key?.participant || 'owner' });
        return replyText(client, message, '✅ Mode maintenance telah *DINONAKTIFKAN*. Bot kembali normal.');
      }

      const active = isMaintenanceActive();
      return replyText(
        client,
        message,
        `Status Maintenance: *${active ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}*\n\nGunakan: \`.maintenance on [durasi]\` atau \`.maintenance off\``
      );
    },
  }),
];
