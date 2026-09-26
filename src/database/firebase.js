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

function resolveServiceAccount() {
  // 1. Opsi A: Path file JSON kredensial (paling mudah di-edit di server/local)
  const credPath = process.env.FIREBASE_CREDENTIALS_PATH;
  if (credPath) {
    const resolvedPath = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    if (fs.existsSync(resolvedPath)) {
      try {
        return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      } catch (err) {
        console.warn(`[FIREBASE] Gagal membaca file FIREBASE_CREDENTIALS_PATH (${resolvedPath}):`, err.message);
      }
    }
  }

  // 2. Opsi B: Variabel terpisah per field (mudah dibaca & diedit manual di .env)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
    // Bersihkan kutip ganda atau tunggal yang membungkus key
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    // Ganti literal \n dengan newline asli
    privateKey = privateKey.replace(/\\n/g, '\n');

    return {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID.trim(),
      client_email: process.env.FIREBASE_CLIENT_EMAIL.trim(),
      private_key: privateKey,
      client_id: process.env.FIREBASE_CLIENT_ID || undefined,
    };
  }

  // 3. Opsi C: JSON String utuh atau Base64 Encoded di FIREBASE_SERVICE_ACCOUNT
  const envSecret = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envSecret && envSecret.trim()) {
    try {
      const trimmed = envSecret.trim();
      if (trimmed.startsWith('{')) {
        return JSON.parse(trimmed);
      }
      // Coba decode jika formatnya base64
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      if (decoded.trim().startsWith('{')) {
        return JSON.parse(decoded);
      }
    } catch (err) {
      console.warn('[FIREBASE] Gagal mem-parse FIREBASE_SERVICE_ACCOUNT:', err.message);
    }
  }

  // 4. Opsi D: Fallback otomatis ke folder src/database/secrets/
  const secretsDir = path.join(__dirname, 'secrets');
  if (fs.existsSync(secretsDir)) {
    const files = fs
      .readdirSync(secretsDir)
      .filter((file) => file.endsWith('.json'))
      .sort();

    if (files.length > 0) {
      try {
        return JSON.parse(fs.readFileSync(path.join(secretsDir, files[0]), 'utf8'));
      } catch (err) {
        console.warn('[FIREBASE] Gagal membaca file secret lokal:', err.message);
      }
    }
  }

  return null;
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

  const serviceAccount = resolveServiceAccount();

  if (!serviceAccount) {
    throw new Error(
      'Firebase credentials not found. Silakan set FIREBASE_CREDENTIALS_PATH atau FIREBASE_PROJECT_ID & FIREBASE_PRIVATE_KEY di .env.'
    );
  }

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
  resolveServiceAccount,
};
