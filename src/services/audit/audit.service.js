const { getDb } = require('../../database/firebase');

const VALID_CATEGORIES = ['OWNER', 'GROUP', 'ADMIN', 'SECURITY', 'SETTINGS'];

// In-memory ring buffer for recent audit logs (last 100 entries)
const recentLogs = [];
const MAX_RECENT_LOGS = 100;

function formatTimestamp(ts) {
  try {
    const d = new Date(ts);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  } catch {
    return '—';
  }
}

async function logAudit(category, action, metadata = {}) {
  const cat = String(category || 'SECURITY').toUpperCase();
  const validCat = VALID_CATEGORIES.includes(cat) ? cat : 'SECURITY';

  const entry = {
    category: validCat,
    action: String(action || '').trim(),
    metadata: typeof metadata === 'object' ? metadata : { note: String(metadata) },
    timestamp: Date.now(),
  };

  recentLogs.unshift(entry);
  if (recentLogs.length > MAX_RECENT_LOGS) {
    recentLogs.pop();
  }

  // Persist asynchronously to database
  getDb().then(async (db) => {
    try {
      await db.collection('audit_logs').add({
        ...entry,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // ponytail: in-memory ring buffer keeps logs if db fails
    }
  }).catch(() => {});

  return entry;
}

function getAuditLogs(filterCategory = null, limit = 15) {
  let filtered = recentLogs;
  if (filterCategory) {
    const target = String(filterCategory).toUpperCase().trim();
    if (target === 'USER') {
      filtered = recentLogs.filter((l) => l.category === 'SECURITY' || l.category === 'ADMIN');
    } else {
      filtered = recentLogs.filter((l) => l.category === target);
    }
  }
  return filtered.slice(0, Math.min(limit, 50));
}

function formatAuditLogs(logs) {
  if (!logs || logs.length === 0) {
    return 'Belum ada catatan audit log.';
  }

  const lines = logs.map((l) => {
    const time = formatTimestamp(l.timestamp);
    return `[${l.category}] ${l.action}\n  ↳ _${time}_`;
  });

  return [
    '╭─〔 📜 AUDIT LOG 〕',
    '│',
    lines.map((l) => `│ ${l.split('\n').join('\n│ ')}`).join('\n│\n'),
    '│',
    '╰──────────────────',
  ].join('\n');
}

function clearMemoryLogs() {
  recentLogs.length = 0;
}

module.exports = {
  VALID_CATEGORIES,
  logAudit,
  getAuditLogs,
  formatAuditLogs,
  clearMemoryLogs,
};
