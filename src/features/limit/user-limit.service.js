const { getUserByJid, saveUser } = require('../../database/repositories/user.repository');
const { getDb } = require('../../database/firebase');

class UserLimitService {
  static async setLimit(targetJid, amount) {
    const num = parseInt(amount, 10);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error('Jumlah limit harus angka positif.');
    }
    const user = await getUserByJid(targetJid);
    if (!user) throw new Error('User tidak ditemukan.');

    user.limit = num;
    user.maxLimit = num;
    user.updatedAt = new Date().toISOString();
    await saveUser(user);
    return user;
  }

  static async addLimit(targetJid, amount) {
    const num = parseInt(amount, 10);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error('Jumlah limit harus angka positif.');
    }
    const user = await getUserByJid(targetJid);
    if (!user) throw new Error('User tidak ditemukan.');

    user.limit = (user.limit || 0) + num;
    user.maxLimit = Math.max(user.maxLimit || 0, user.limit);
    user.updatedAt = new Date().toISOString();
    await saveUser(user);
    return user;
  }

  static async addLimitAll(amount) {
    const num = parseInt(amount, 10);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error('Jumlah limit harus angka positif.');
    }
    const db = await getDb();
    const snapshot = await db.collection('users').get();
    let updatedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const current = data.limit || 0;
      await doc.ref.update({
        limit: current + num,
        maxLimit: Math.max(data.maxLimit || 0, current + num),
        updatedAt: new Date().toISOString(),
      });
      updatedCount++;
    }
    return updatedCount;
  }
}

module.exports = UserLimitService;
