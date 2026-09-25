const fs = require('fs');
const path = require('path');

let appInstance = null;
let dbInstance = null;
let adminSdkCache = null;

async function getFirebaseAdmin() {
  if (adminSdkCache) {
    return adminSdkCache;
  }

  try {
    const required = require('firebase-admin');
    adminSdkCache = required?.default || required;
    return adminSdkCache;
  } catch (error) {
    try {
      const imported = await import('firebase-admin');
      adminSdkCache = imported?.default || imported;
      return adminSdkCache;
    } catch (importError) {
      throw new Error(
        `Failed to load firebase-admin via CommonJS or ESM import: ${importError.message}`
      );
    }
  }
}

function resolveServiceAccountPath() {
  const secretsDir = path.join(__dirname, 'secrets');

  if (!fs.existsSync(secretsDir)) {
    return null;
  }

  const files = fs
    .readdirSync(secretsDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    return null;
  }

  return path.join(secretsDir, files[0]);
}

async function initializeFirebase() {
  if (appInstance) {
    return appInstance;
  }

  const admin = await getFirebaseAdmin();

  const certFactory = admin?.credential?.cert || admin?.cert;

  if (!admin || typeof certFactory !== 'function') {
    throw new Error(
      'firebase-admin is not loaded correctly. Please ensure the package is installed and compatible with the current module system.'
    );
  }

  const serviceAccountPath = resolveServiceAccountPath();

  if (!serviceAccountPath) {
    throw new Error(
      'Firebase service account file not found in src/database/secrets.'
    );
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8')
  );

  appInstance = admin.initializeApp({
    credential: certFactory(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });

  let firestoreModule = null;

  try {
    firestoreModule = require('firebase-admin/firestore');
  } catch (error) {
    firestoreModule = null;
  }

  if (!firestoreModule) {
    try {
      firestoreModule = await import('firebase-admin/firestore');
    } catch (error) {
      throw new Error(
        `Firebase Firestore module could not be loaded: ${error.message}`
      );
    }
  }

  const getFirestore = firestoreModule?.getFirestore || firestoreModule?.default?.getFirestore;

  if (typeof getFirestore !== 'function') {
    throw new Error('Firebase Firestore API is unavailable in the installed firebase-admin package.');
  }

  dbInstance = getFirestore(appInstance);

  return appInstance;
}

async function getApp() {
  if (!appInstance) {
    await initializeFirebase();
  }

  return appInstance;
}

async function getDb() {
  if (!dbInstance) {
    await initializeFirebase();
  }

  return dbInstance;
}

async function disconnectFirebase() {
  if (!appInstance) {
    return true;
  }

  try {
    await appInstance.delete();
    appInstance = null;
    dbInstance = null;
    return true;
  } catch (error) {
    console.warn('[FIREBASE] Failed to delete app:', error.message);
    return false;
  }
}

module.exports = {
  initializeFirebase,
  getApp,
  getDb,
  disconnectFirebase,
};
