const { replyText } = require('./reply');
const { messages } = require('../messages');

function createCommand({
  name,
  aliases = [],
  description = '',
  access = 'public',
  execute,
}) {
  return {
    name,
    aliases,
    description,
    access,
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
}) {
  return createCommand({
    name,
    aliases,
    description,
    execute: async (client, message) => {
      return replyText(client, message, messages.bot.notImplemented(name));
    },
  });
}

module.exports = {
  createCommand,
  createPlaceholderCommand,
};
