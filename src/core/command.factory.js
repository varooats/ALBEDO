const { replyText } = require('./reply');
const { messages } = require('../messages');

function createCommand({
  name,
  aliases = [],
  description = '',
  access = 'public',
  permission,
  category = '',
  execute,
}) {
  return {
    name,
    aliases,
    description,
    access,
    permission: permission || access,
    category,
    execute: async (client, message, args = []) => {
      if (typeof execute === 'function') {
        return execute(client, message, args);
      }

      return false;
    },
  };
}

function createPlaceholderCommand({
  name,
  aliases = [],
  description = '',
  permission = 'SUPEROWNER',
  access = 'owner',
}) {
  return createCommand({
    name,
    aliases,
    description,
    access,
    permission,
    execute: async (client, message) => {
      return replyText(client, message, messages.bot.notImplemented(name));
    },
  });
}

module.exports = {
  createCommand,
  createPlaceholderCommand,
};
