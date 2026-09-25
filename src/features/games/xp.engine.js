const { getUserByJid, saveUser } = require('../../database/repositories/user.repository');
const { getDb } = require('../../database/firebase');
const { createUserModel } = require('../../database/models/user.model');

const XP_REWARDS = {
  win: 20,
  correct_quiz: 10,
  lose: 3,
  surrender: 0,
  daily: 15,
  draw: 5,
};

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 850 },
  { level: 6, xp: 1300 },
  { level: 7, xp: 1850 },
  { level: 8, xp: 2500 },
  { level: 9, xp: 3300 },
  { level: 10, xp: 4200 },
];

function getLevelForXp(xp) {
  let level = 1;
  for (const t of LEVEL_THRESHOLDS) {
    if (xp >= t.xp) level = t.level;
    else break;
  }
  return level;
}

function getXpForNextLevel(currentLevel) {
  const next = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel + 1);
  return next ? next.xp : null;
}

async function awardXp(jid, reason = 'win') {
  const xpGained = XP_REWARDS[reason] ?? 0;
  if (!xpGained) return { xpGained: 0, leveledUp: false };

  const user = await getUserByJid(jid);
  if (!user) return null;

  const oldLevel = user.level || 1;
  const newExp = (user.exp || 0) + xpGained;
  const newLevel = getLevelForXp(newExp);

  const updated = createUserModel({
    ...user,
    exp: newExp,
    level: newLevel,
    updatedAt: new Date().toISOString(),
  });

  await saveUser(updated);

  return {
    user: updated,
    xpGained,
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
  };
}

async function getLeaderboard(limit = 10) {
  const db = await getDb();
  const snapshot = await db
    .collection('users')
    .orderBy('exp', 'desc')
    .limit(limit)
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc, i) => {
    const data = doc.data();
    return {
      rank: i + 1,
      name: data.name || 'User',
      username: data.username || 'anon',
      jid: data.jid || doc.id,
      exp: data.exp || 0,
      level: data.level || 1,
    };
  });
}

module.exports = {
  XP_REWARDS,
  LEVEL_THRESHOLDS,
  getLevelForXp,
  getXpForNextLevel,
  awardXp,
  getLeaderboard,
};
