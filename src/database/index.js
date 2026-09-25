const { initializeFirebase, disconnectFirebase } = require('./firebase');

module.exports = {
  connect: async () => {
    try {
      await initializeFirebase();
      return true;
    } catch (error) {
      console.warn('[DB] Firebase connect failed:', error.message);
      return false;
    }
  },
  disconnect: async () => {
    try {
      await disconnectFirebase();
      return true;
    } catch (error) {
      console.warn('[DB] Firebase disconnect failed:', error.message);
      return false;
    }
  },
};
