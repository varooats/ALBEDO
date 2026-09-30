const { replyText } = require('./reply');
const { messages } = require('../messages');
const { ROLES } = require('./roles');

function resolveCommandRoles({ roles, access, permission, isPublic }) {
  if (Array.isArray(roles) && roles.length > 0) {
    return roles;
  }

  if (isPublic || access === 'public' || access === 'guest') {
    return [ROLES.GUEST, ROLES.USER, ROLES.PREMIUM, ROLES.VIP, ROLES.OWNER];
  }

  const p = String(permission || access || 'user').toLowerCase();
  if (p === 'superowner') return [ROLES.SUPEROWNER];
  if (p === 'owner') return [ROLES.OWNER, ROLES.SUPEROWNER];
  if (p === 'admin') return [ROLES.ADMIN, ROLES.OWNER, ROLES.SUPEROWNER];
  if (p === 'group_admin' || p === 'group-admin' || p === 'moderator' || p === 'mod') {
    return [ROLES.GROUP_ADMIN, ROLES.ADMIN, ROLES.OWNER, ROLES.SUPEROWNER];
  }
  if (p === 'vip') return [ROLES.VIP, ROLES.OWNER, ROLES.SUPEROWNER];
  if (p === 'premium') return [ROLES.PREMIUM, ROLES.VIP, ROLES.OWNER, ROLES.SUPEROWNER];

  return [ROLES.USER, ROLES.PREMIUM, ROLES.VIP, ROLES.OWNER, ROLES.SUPEROWNER];
}

function createCommand({
  name,
  aliases = [],
  description = '',
  roles,
  access = 'user',
  permission,
  isPublic = false,
  isFree = false,
  limit = 1,
  cooldown = 0,
  category = '',
  execute,
}) {
  const resolvedRoles = resolveCommandRoles({ roles, access, permission, isPublic });
  const isCommandPublic = isPublic || access === 'public' || resolvedRoles.includes(ROLES.GUEST);
  const resolvedLimit = (isCommandPublic || isFree || access === 'owner' || permission === 'OWNER' || permission === 'SUPEROWNER')
    ? 0
    : limit;

  return {
    name,
    aliases,
    description,
    roles: resolvedRoles,
    access,
    permission: permission || access,
    isPublic: isCommandPublic,
    isFree: isFree || resolvedLimit === 0,
    limit: resolvedLimit,
    cooldown: Number(cooldown) || 0,
    category,
    execute: async (client, message, args = [], ctx = {}) => {
      if (typeof execute === 'function') {
        return execute(client, message, args, ctx);
      }
      return false;
    },
  };
}

function createPlaceholderCommand({
  name,
  aliases = [],
  description = '',
  roles = [ROLES.SUPEROWNER, ROLES.OWNER],
  access = 'owner',
}) {
  return createCommand({
    name,
    aliases,
    description,
    roles,
    access,
    limit: 0,
    cooldown: 0,
    execute: async (client, message) => {
      return replyText(client, message, messages.bot.notImplemented(name));
    },
  });
}

module.exports = {
  createCommand,
  createPlaceholderCommand,
};
