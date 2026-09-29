const { getBotSettings, updateBotSettings } = require('../../database/repositories/bot-settings.repository');
const { logAudit } = require('../audit/audit.service');

let maintenanceState = {
  active: false,
  reason: 'Maintenance berkala',
  startedAt: null,
  resumeAt: null,
};

let shutdownTimer = null;

async function initSystemState() {
  try {
    const settings = await getBotSettings();
    if (settings?.maintenance) {
      maintenanceState = { ...maintenanceState, ...settings.maintenance };
      if (maintenanceState.resumeAt && Date.now() >= maintenanceState.resumeAt) {
        maintenanceState.active = false;
        maintenanceState.resumeAt = null;
      }
    }
  } catch {}
}

async function setMaintenance(active, { reason = 'Maintenance berkala', durationMs = null, by = 'owner' } = {}) {
  const now = Date.now();
  maintenanceState = {
    active: !!active,
    reason: String(reason || 'Maintenance berkala'),
    startedAt: active ? now : null,
    resumeAt: active && durationMs ? now + durationMs : null,
  };

  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
    shutdownTimer = null;
  }

  if (active && durationMs) {
    shutdownTimer = setTimeout(async () => {
      await setMaintenance(false, { by: 'system_auto_resume' });
    }, durationMs);
  }

  try {
    await updateBotSettings({ maintenance: maintenanceState });
  } catch {}

  await logAudit('SETTINGS', `Maintenance ${active ? 'enabled' : 'disabled'}${durationMs ? ` (${Math.round(durationMs / 60000)}m)` : ''}`, { by });
  return maintenanceState;
}

function isMaintenanceActive() {
  if (!maintenanceState.active) return false;
  if (maintenanceState.resumeAt && Date.now() >= maintenanceState.resumeAt) {
    maintenanceState.active = false;
    maintenanceState.resumeAt = null;
    return false;
  }
  return true;
}

function parseDuration(str) {
  if (!str) return null;
  const match = String(str).trim().match(/^(\d+)(s|m|h|d)?$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = (match[2] || 'm').toLowerCase();
  if (unit === 's') return val * 1000;
  if (unit === 'm') return val * 60 * 1000;
  if (unit === 'h') return val * 60 * 60 * 1000;
  if (unit === 'd') return val * 24 * 60 * 60 * 1000;
  return val * 60 * 1000;
}

const MAINTENANCE_MESSAGE = [
  '🔧 *MAINTENANCE*',
  '',
  'ALBEDO sedang dalam maintenance.',
  '',
  'Bot akan kembali setelah selesai.',
].join('\n');

module.exports = {
  initSystemState,
  setMaintenance,
  isMaintenanceActive,
  parseDuration,
  MAINTENANCE_MESSAGE,
};
