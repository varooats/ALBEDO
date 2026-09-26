const { getGroup, updateGroupSettings, approveGroup } = require('../../database/repositories/group.repository');
const config = require('../../config/bot.config');
const { jidToMentionName } = require('../../utils/message');

// Timers for auto-leave: groupJid -> { timer, timeoutAt, inviteNotified }
const pendingGroups = new Map();

const AUTO_LEAVE_MINUTES = 5;

/**
 * Handle new group join event
 * When ALBEDO is invited to a group:
 * 1. Check if group is already active/whitelisted.
 * 2. If not, notify Owner with Group ID for approval.
 * 3. Schedule auto-leave after X minutes (default 5 minutes).
 */
async function handleBotGroupJoin(client, groupJid, groupName = '') {
  if (!groupJid || !String(groupJid).endsWith('@g.us')) return;

  try {
    const existing = await getGroup(groupJid);
    if (existing?.status === 'active') {
      return; // Already approved
    }

    // Set status to pending in DB
    await updateGroupSettings(groupJid, {
      status: 'pending',
      name: groupName || undefined,
      invitedAt: Date.now(),
    });

    // Notify Owner with Group ID for one-click approval
    const ownerJid = `${String(config.owner || '').replace(/\D/g, '')}@s.whatsapp.net`;
    const noticeText = [
      '🔔 *PERMINTAAN APPROVAL GRUP*',
      '',
      `ALBEDO telah dimasukkan ke dalam grup baru:`,
      `• Nama  : *${groupName || 'Grup WhatsApp'}*`,
      `• ID    : \`\`\`${groupJid}\`\`\``,
      '',
      `Grup ini memiliki batas waktu ${AUTO_LEAVE_MINUTES} menit untuk disetujui.`,
      `Untuk menyetujui, balas pesan ini dengan:`,
      `\`\`\`.approvegroup ${groupJid}\`\`\``,
      '',
      `Atau tolak & keluar dengan:`,
      `\`\`\`.leavegroup ${groupJid}\`\`\``,
    ].join('\n');

    try {
      await client.sendMessage(ownerJid, { text: noticeText });
    } catch (e) {
      console.warn('[GROUP:INVITE] Failed to notify owner:', e?.message || e);
    }

    // Send temporary notice to the group
    try {
      await client.sendMessage(groupJid, {
        text: `⏳ *ALBEDO SYSTEM*\n\nBot ini berstatus *PENDING APPROVAL*. Owner sedang meninjau izin bot di grup ini.\nJika tidak disetujui dalam ${AUTO_LEAVE_MINUTES} menit, bot akan otomatis keluar.`,
      });
    } catch {}

    // Schedule auto leave
    scheduleAutoLeave(client, groupJid);
  } catch (err) {
    console.error('[GROUP:JOIN] Error handling bot join:', err);
  }
}

function scheduleAutoLeave(client, groupJid) {
  if (pendingGroups.has(groupJid)) {
    clearTimeout(pendingGroups.get(groupJid).timer);
  }

  const timeoutMs = AUTO_LEAVE_MINUTES * 60 * 1000;
  const timer = setTimeout(async () => {
    pendingGroups.delete(groupJid);
    try {
      const groupData = await getGroup(groupJid);
      if (groupData?.status === 'active') {
        return; // was approved in time
      }

      console.log(`[GROUP:AUTO_LEAVE] Leaving unapproved group: ${groupJid}`);
      try {
        await client.sendMessage(groupJid, {
          text: '⏰ *WAKTU APPROVAL HABIS*\n\nGrup ini belum disetujui oleh Owner. ALBEDO pamit keluar.',
        });
      } catch {}

      await client.groupLeave(groupJid);
    } catch (err) {
      console.warn(`[GROUP:AUTO_LEAVE] Error leaving ${groupJid}:`, err?.message || err);
    }
  }, timeoutMs);

  pendingGroups.set(groupJid, {
    timer,
    timeoutAt: Date.now() + timeoutMs,
  });
}

function cancelAutoLeave(groupJid) {
  if (pendingGroups.has(groupJid)) {
    clearTimeout(pendingGroups.get(groupJid).timer);
    pendingGroups.delete(groupJid);
  }
}

module.exports = {
  handleBotGroupJoin,
  scheduleAutoLeave,
  cancelAutoLeave,
  AUTO_LEAVE_MINUTES,
};
