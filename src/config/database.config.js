module.exports = {
  url: process.env.DATABASE_URL || 'sqlite://./storage/database.db',
  dialect: process.env.DB_DIALECT || 'sqlite',
};
