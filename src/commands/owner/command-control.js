const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { ROLES } = require('../../core/roles');
const {
  setGlobalCommand,
  setGroupCommand,
  getGlobalDisabledCommands,
} = require('../../services/feature/feature-control.service');

module.exports = createCommand({
  name: 'command',
  aliases: ['cmd', 'disablecmd', 'enablecmd'],
  description: 'Aktifkan atau nonaktifkan command tertentu secara global atau per grup.',
  roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.GROUP_ADMIN],
  isFree: true,
  execute: async (client, message, args = [], ctx = {}) => {
    const rawAction = args[0]?.toLowerCase().trim();
    const targetCmd = args[1]?.toLowerCase().replace(/^\./, '').trim();

    // Support syntax: .disablecmd tiktok or .enablecmd tiktok
    const invokingCmd = (message?.body || '').toLowerCase().split(/\s+/)[0].replace(/^[.!/#]/, '');
    let action = rawAction;
    let cmd = targetCmd;

    if (invokingCmd === 'disablecmd') {
      action = 'off';
      cmd = args[0]?.toLowerCase().replace(/^\./, '').trim();
    } else if (invokingCmd === 'enablecmd') {
      action = 'on';
      cmd = args[0]?.toLowerCase().replace(/^\./, '').trim();
    }

    if (!action || !['on', 'off', 'list'].includes(action)) {
      await replyText(
        client,
        message,
        '╭─『 ⚙️ COMMAND CONTROL 』\n│\n│ Format:\n│ ⟢ ```.command off <nama_command>```\n│ ⟢ ```.command on <nama_command>```\n│ ⟢ ```.command list```\n│\n│ Atau per-grup:\n│ ⟢ ```.command off <cmd> --group```\n╰──────────────────'
      );
      return true;
    }

    if (action === 'list') {
      const list = getGlobalDisabledCommands();
      const text = list.length > 0
        ? list.map((c, i) => `│ ${i + 1}. .${c}`).join('\n')
        : '│ (Tidak ada command yang dinonaktifkan)';
      await replyText(
        client,
        message,
        `╭─『 🚫 DISABLED COMMANDS 』\n│\n${text}\n│\n╰──────────────────`
      );
      return true;
    }

    if (!cmd) {
      await replyText(client, message, 'Sebutkan nama command yang ingin diatur. Contoh: ```.command off tiktok```');
      return true;
    }

    const isGroupScope = args.includes('--group') || (!ctx.isOwner && ctx.isGroup);
    const enable = action === 'on';

    if (isGroupScope && ctx.groupJid) {
      if (!ctx.isGroupAdmin && !ctx.isOwner) {
        await replyText(client, message, 'Khusus admin grup atau bot owner.');
        return false;
      }
      await setGroupCommand(ctx.groupJid, cmd, enable);
      await replyText(
        client,
        message,
        `✅ Perintah *.${cmd}* berhasil *${enable ? 'diaktifkan' : 'dinonaktifkan'}* di grup ini.`
      );
      return true;
    }

    if (!ctx.isOwner) {
      await replyText(client, message, 'Hanya Bot Owner yang dapat menonaktifkan command secara global.');
      return false;
    }

    await setGlobalCommand(cmd, enable);
    await replyText(
      client,
      message,
      `✅ Perintah *.${cmd}* berhasil *${enable ? 'diaktifkan' : 'dinonaktifkan'}* secara global.`
    );
    return true;
  },
});
