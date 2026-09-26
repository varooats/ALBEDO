const { getGroupSettings, updateGroupSettings, DEFAULT_SETTINGS } = require('../../database/repositories/group.repository');

class GroupSettingsService {
  static async getSettings(groupJid) {
    try {
      return await getGroupSettings(groupJid);
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  static async updateSettings(groupJid, patch) {
    return updateGroupSettings(groupJid, patch);
  }

  static async setAntilink(groupJid, mode) {
    if (!['all', 'custom', 'off'].includes(mode)) {
      throw new Error('Mode antilink harus all, custom, atau off.');
    }
    return updateGroupSettings(groupJid, { antilink: mode });
  }

  static async addLink(groupJid, domain) {
    const clean = String(domain || '').toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!clean || !clean.includes('.')) throw new Error('Domain tidak valid.');
    const settings = await this.getSettings(groupJid);
    const links = Array.isArray(settings.links) ? [...settings.links] : [];
    if (!links.includes(clean)) {
      links.push(clean);
      await updateGroupSettings(groupJid, { links });
    }
    return clean;
  }

  static async delLink(groupJid, domain) {
    const clean = String(domain || '').toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    const settings = await this.getSettings(groupJid);
    const links = (settings.links || []).filter((l) => l !== clean);
    await updateGroupSettings(groupJid, { links });
    return clean;
  }

  static async setAntitoxic(groupJid, enabled) {
    return updateGroupSettings(groupJid, { antitoxic: Boolean(enabled) });
  }

  static async addBadword(groupJid, word) {
    const clean = String(word || '').trim().toLowerCase();
    if (!clean) throw new Error('Kata tidak valid.');
    const settings = await this.getSettings(groupJid);
    const badwords = Array.isArray(settings.badwords) ? [...settings.badwords] : [];
    if (!badwords.includes(clean)) {
      badwords.push(clean);
      await updateGroupSettings(groupJid, { badwords });
    }
    return clean;
  }

  static async delBadword(groupJid, word) {
    const clean = String(word || '').trim().toLowerCase();
    const settings = await this.getSettings(groupJid);
    const badwords = (settings.badwords || []).filter((w) => w !== clean);
    await updateGroupSettings(groupJid, { badwords });
    return clean;
  }
}

module.exports = GroupSettingsService;
