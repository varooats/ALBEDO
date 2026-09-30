const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';
const isStaging = env === 'staging';

module.exports = {
  env,
  isProd,
  isStaging,
  isDev: !isProd && !isStaging,
  name: process.env.BOT_NAME,
  prefix: process.env.BOT_PREFIX,
  owner: process.env.OWNER_NUMBER,
  ownerName: process.env.OWNER_NAME,
  ownerRole: process.env.OWNER_ROLE,
  ownerContact: process.env.OWNER_CONTACT || process.env.OWNER_NUMBER,
  donateInfo: process.env.DONATE_INFO,
  developerName: process.env.DEV_NAME,
  developerRole: process.env.DEV_ROLE,
  developerGithub: process.env.DEV_GITHUB,
  developerWebsite: process.env.DEV_WEBSITE,
  developerInstagram: process.env.DEV_INSTAGRAM,
  debug: !isProd,
  logLevel: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  ai: {
    baseUrl: process.env.APMIX_BASE_URL,
    apiKey: process.env.APMIX_API_KEY,
    model: process.env.APMIX_MODEL,
  },
};
