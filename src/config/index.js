const botConfig = require('./bot.config');
const databaseConfig = require('./database.config');
const { getBotSettings, updateBotSettings } = require('../database/repositories/bot-settings.repository');

/**
 * Get dynamic configuration merging Firestore (settings/bot) with .env (bot.config.js) fallback
 */
async function getConfig() {
  let dbSettings = {};
  try {
    dbSettings = await getBotSettings();
  } catch (err) {
    // If DB is offline or not configured yet, silently fallback to .env defaults
  }

  return {
    name: dbSettings.name || botConfig.name || 'ALBEDO',
    prefix: dbSettings.prefix || botConfig.prefix || '.',
    owner: dbSettings.owner || botConfig.owner || '6285746345170',
    ownerName: dbSettings.ownerName || botConfig.ownerName || 'varo',
    ownerRole: dbSettings.ownerRole || botConfig.ownerRole || 'OWNER BOT',
    ownerContact: dbSettings.ownerContact || botConfig.ownerContact || botConfig.owner || '6285111411152',
    donateInfo: dbSettings.donateInfo || botConfig.donateInfo || 'Hubungi owner untuk detail donasi operasional bot.',
    developerName: dbSettings.developerName || botConfig.developerName || 'Varo',
    developerRole: dbSettings.developerRole || botConfig.developerRole || 'Developer',
    developerGithub: dbSettings.developerGithub || botConfig.developerGithub || 'https://github.com/varooats',
    developerWebsite: dbSettings.developerWebsite || botConfig.developerWebsite || 'https://varooats.xyz',
    developerInstagram: dbSettings.developerInstagram || botConfig.developerInstagram || '@varooats',
    debug: botConfig.debug,
    database: databaseConfig,
    ...dbSettings, // Include dynamic flags like public, autoread, grouponly, anticall
  };
}

module.exports = {
  ...botConfig,
  database: databaseConfig,
  getConfig,
  updateConfig: updateBotSettings,
};
