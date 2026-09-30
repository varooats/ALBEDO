const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { ROLES } = require('../../core/roles');
const {
  approveGroup,
  setGroupStatus,
  listApprovedGroups,
  getGroupSettings,
} = require('../../database/repositories/group.repository');

module.exports = createCommand({
  name: 'groupmanage',
  aliases: ['groupallow', 'groupblock', 'grouplist'],
  description: 'Kelola whitelist dan proteksi akses grup ALBEDO bot.',
  roles: [ROLES.OWNER, ROLES.SUPEROWNER],
  isFree: true,
  execute: async (client, message, args = [], ctx = {}) => {
    const invokingCmd = (message?.body || '').toLowerCase().split(/\s+/)[0].replace(/^[.!/#]/, '');
    let sub = args[0]?.toLowerCase().trim();
    let target = args[1]?.trim() || (ctx.isGroup ? ctx.groupJid : null);

    if (invokingCmd === 'groupallow') {
      sub = 'allow';
      target = args[0]?.trim() || ctx.groupJid;
    } else if (invokingCmd === 'groupblock') {
      sub = 'block';
      target = args[0]?.trim() || ctx.groupJid;
    } else if (invokingCmd === 'grouplist') {
      sub = 'list';
    }

    if (!sub || !['allow', 'block', 'list', 'status'].includes(sub)) {
      await replyText(
        client,
        message,
        '╭─『 🛡️ GROUP ACCESS CONTROL 』\n│\n│ Perintah:\n│ ⟢ ```.groupallow [jid]``` (Izinkan grup)\n│ ⟢ ```.groupblock [jid]``` (Blokir grup & keluar)\n│ ⟢ ```.grouplist``` (Daftar grup aktif)\n│\n│ Contoh:\n│ ⟢ ```.groupallow 120363xxx@g.us```\n╰──────────────────'
      );
      return true;
    }

    if (sub === 'list') {
      const groups = await listApprovedGroups();
      if (!groups || groups.length === 0) {
        await replyText(client, message, 'Belum ada grup yang disetujui (aktif).');
        return true;
      }

      const listText = groups
        .map((g, idx) => `│ ${idx + 1}. *${g.name || 'Grup'}*\n│    ID: \`\`\`${g.jid}\`\`\``)
        .join('\n');

      await replyText(
        client,
        message,
        `╭─『 📋 DAFTAR GRUP TERDAFTAR 』\n│ Total: ${groups.length} grup aktif\n│\n${listText}\n│\n╰──────────────────`
      );
      return true;
    }

    if (!target || !target.endsWith('@g.us')) {
      await replyText(client, message, 'Sebutkan JID grup yang valid (akhiran @g.us) atau jalankan langsung di dalam grup.');
      return true;
    }

    if (sub === 'allow') {
      let groupName = 'Grup WhatsApp';
      try {
        const meta = await client.groupMetadata(target);
        if (meta?.subject) groupName = meta.subject;
      } catch {}

      await approveGroup(target, groupName, ctx.senderNumber || 'owner');
      await replyText(
        client,
        message,
        `✅ *GRUP DISETUJUI*\n\nGrup *${groupName}* (\`\`\`${target}\`\`\`) berhasil ditambahkan ke whitelist bot.`
      );
      return true;
    }

    if (sub === 'block') {
      await setGroupStatus(target, 'blocked');
      try {
        if (typeof client.groupLeave === 'function') {
          await client.groupLeave(target);
        }
      } catch {}
      await replyText(
        client,
        message,
        `⛔ *GRUP DIBLOKIR*\n\nGrup \`\`\`${target}\`\`\` telah diblokir dari akses ALBEDO dan bot keluar dari grup.`
      );
      return true;
    }

    if (sub === 'status') {
      const settings = await getGroupSettings(target);
      await replyText(
        client,
        message,
        `╭─『 📊 STATUS GRUP 』\n│ Status: *${(settings.status || 'pending').toUpperCase()}*\n│ Antilink: *${settings.antilink}*\n│ Antitoxic: *${settings.antitoxic ? 'ON' : 'OFF'}*\n╰──────────────────`
      );
      return true;
    }

    return true;
  },
});
