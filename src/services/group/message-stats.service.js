const { getGroupSettings, updateGroupSettings } = require('../../database/repositories/group.repository');

class MessageStatsService {
  static getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  static getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  static async recordMessage(groupJid) {
    if (!groupJid || !String(groupJid).endsWith('@g.us')) return;
    try {
      const settings = await getGroupSettings(groupJid);
      const today = this.getTodayKey();
      const month = this.getMonthKey();

      const total = (settings.messageCount || 0) + 1;
      const byDay = { ...(settings.messageCountByDay || {}) };
      const byMonth = { ...(settings.messageCountByMonth || {}) };

      byDay[today] = (byDay[today] || 0) + 1;
      byMonth[month] = (byMonth[month] || 0) + 1;

      await updateGroupSettings(groupJid, {
        messageCount: total,
        messageCountByDay: byDay,
        messageCountByMonth: byMonth,
      });
    } catch {
      // Non-critical tracking error
    }
  }

  static async getStats(groupJid, period = 'all') {
    const settings = await getGroupSettings(groupJid);
    const cleanPeriod = String(period || 'all').trim().toLowerCase();

    if (cleanPeriod === 'day' || cleanPeriod === 'hari') {
      const today = this.getTodayKey();
      const count = (settings.messageCountByDay || {})[today] || 0;
      return { period: 'Hari ini', count, key: today };
    }

    if (cleanPeriod === 'month' || cleanPeriod === 'bulan') {
      const month = this.getMonthKey();
      const count = (settings.messageCountByMonth || {})[month] || 0;
      return { period: 'Bulan ini', count, key: month };
    }

    return { period: 'Semua waktu', count: settings.messageCount || 0 };
  }
}

module.exports = MessageStatsService;
