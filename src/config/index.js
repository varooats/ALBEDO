const botConfig = require('./bot.config');
const databaseConfig = require('./database.config');

module.exports = {
  ...botConfig,
  database: databaseConfig,
};
