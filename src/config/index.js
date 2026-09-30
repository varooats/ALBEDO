const botConfig = require('./bot.config');
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
    name: dbSettings.name || botConfig.name,
    prefix: dbSettings.prefix || botConfig.prefix,
    owner: dbSettings.owner || botConfig.owner,
    ownerName: dbSettings.ownerName || botConfig.ownerName,
    ownerRole: dbSettings.ownerRole || botConfig.ownerRole,
    ownerContact: dbSettings.ownerContact || botConfig.ownerContact || botConfig.owner,
    donateInfo: dbSettings.donateInfo || botConfig.donateInfo,
    developerName: dbSettings.developerName || botConfig.developerName,
    developerRole: dbSettings.developerRole || botConfig.developerRole,
    developerGithub: dbSettings.developerGithub || botConfig.developerGithub,
    developerWebsite: dbSettings.developerWebsite || botConfig.developerWebsite,
    developerInstagram: dbSettings.developerInstagram || botConfig.developerInstagram,
    debug: botConfig.debug,
    ...dbSettings, // Include dynamic flags like public, autoread, grouponly, anticall
  };
}

module.exports = {
  ...botConfig,
  getConfig,
  updateConfig: updateBotSettings,
};
