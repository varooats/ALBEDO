const activeSessions = new Map();

const SESSION_TTL_MS = 5 * 60 * 1000;

function getSession(jid) {
  const session = activeSessions.get(jid);
  if (!session) return null;

  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    if (session.timer) clearTimeout(session.timer);
    activeSessions.delete(jid);
    return null;
  }

  return session;
}

function setSession(jid, sessionData) {
  const existing = activeSessions.get(jid);
  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const session = {
    ...sessionData,
    createdAt: Date.now(),
  };

  activeSessions.set(jid, session);
  return session;
}

function deleteSession(jid) {
  const existing = activeSessions.get(jid);
  if (existing?.timer) {
    clearTimeout(existing.timer);
  }
  return activeSessions.delete(jid);
}

function hasSession(jid) {
  return getSession(jid) !== null;
}

function cleanExpired() {
  const now = Date.now();
  let cleaned = 0;
  for (const [jid, s] of activeSessions.entries()) {
    if (now - s.createdAt > SESSION_TTL_MS) {
      if (s.timer) clearTimeout(s.timer);
      activeSessions.delete(jid);
      cleaned++;
    }
  }
  return cleaned;
}

module.exports = {
  getSession,
  setSession,
  deleteSession,
  hasSession,
  cleanExpired,
};
