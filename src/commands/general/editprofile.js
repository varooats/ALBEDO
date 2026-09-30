const path = require('path');
const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { getUserByJid, updateProfileField } = require('../../database/repositories/user.repository');
const { messages } = require('../../messages');
const { resolveJid } = require('../../utils/message');

const EDITPROFILE_THUMBNAIL = path.resolve(__dirname, '../../../assets/thumbnail-1.jpg');

const FIELD_MAP = {
  gender: 'gender',
  sex: 'gender',
  kelamin: 'gender',
  jeniskelamin: 'gender',
  username: 'username',
  uname: 'username',
  user: 'username',
  social: 'social',
  sosmed: 'social',
  instagram: 'social',
  ig: 'social',
  age: 'age',
  umur: 'age',
  usia: 'age',
  bio: 'bio',
  desc: 'bio',
  deskripsi: 'bio',
  quote: 'bio',
  tagline: 'bio',
  name: 'name',
  nama: 'name',
};

const ALLOWED_FIELDS = new Set(['name', 'gender', 'username', 'social', 'age', 'bio']);

function parseMultipleFields(rawArgs = []) {
  const joined = String((rawArgs || []).join(' ')).trim();
  if (!joined) return [];

  // Support pipe delimiter | and newline delimiter
  const parts = joined.split(/[|\n]+/).map((p) => p.trim()).filter(Boolean);
  const list = [];

  for (const part of parts) {
    let key = '';
    let value = '';

    if (part.includes(':')) {
      const [k, v] = part.split(/:(.*)/s);
      key = String(k || '').trim().toLowerCase();
      value = String(v || '').trim();
    } else if (part.includes('=')) {
      const [k, v] = part.split(/=(.*)/s);
      key = String(k || '').trim().toLowerCase();
      value = String(v || '').trim();
    } else {
      const [k, ...rest] = part.split(/\s+/);
      key = String(k || '').trim().toLowerCase();
      value = rest.join(' ').trim();
    }

    if (key) {
      list.push({ key, value });
    }
  }

  return list;
}

function validateFieldValue(field, rawValue) {
  const value = String(rawValue || '').trim();

  if (!value) {
    return { valid: false, error: `Nilai untuk \`\`\`${field}\`\`\` tidak boleh kosong.` };
  }

  if (field === 'age') {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1 || num > 120) {
      return { valid: false, error: 'Umur (age) harus berupa angka wajar antara 1 - 120.' };
    }
    return { valid: true, value: num };
  }

  if (field === 'name') {
    if (value.length > 30) {
      return { valid: false, error: 'Nama (name) maksimal 30 karakter.' };
    }
    return { valid: true, value };
  }

  if (field === 'username') {
    const cleanUname = value.replace(/^@+/, '');
    if (cleanUname.length > 25) {
      return { valid: false, error: 'Username maksimal 25 karakter.' };
    }
    return { valid: true, value: cleanUname };
  }

  if (field === 'bio') {
    if (value.length > 150) {
      return { valid: false, error: 'Bio maksimal 150 karakter.' };
    }
    return { valid: true, value };
  }

  if (field === 'social') {
    if (value.length > 50) {
      return { valid: false, error: 'Social media maksimal 50 karakter.' };
    }
    return { valid: true, value };
  }

  return { valid: true, value };
}

async function sendEditProfileHelp(client, message) {
  const jid = message?.key?.remoteJid;
  const helpText = messages.profile.editprofile.help;

  if (!jid) {
    return replyText(client, message, helpText);
  }

  try {
    await client.sendMessage(
      jid,
      {
        image: { url: EDITPROFILE_THUMBNAIL },
        mimetype: 'image/jpeg',
        caption: helpText,
      },
      { quoted: message }
    );
    return true;
  } catch (error) {
    console.warn('[EDITPROFILE] Thumbnail help failed:', error?.message || error);
    return replyText(client, message, helpText);
  }
}

module.exports = createCommand({
  name: 'editprofile',
  aliases: ['setprofile', 'updateprofile'],
  description: 'Edit profil user seperti name, gender, username, age, social, bio.',
  isFree: true,
  cooldown: 3,
  execute: async (client, message, args = [], ctx = {}) => {
    const jid = resolveJid(message) || ctx?.senderJid;
    if (!jid) return false;

    const user = (await getUserByJid(jid)) || ctx?.globalUser || (ctx?.senderNumber ? await getUserByJid(ctx.senderNumber) : null);
    if (!user) {
      await replyText(client, message, messages.profile.notFound);
      return true;
    }

    const entries = parseMultipleFields(args);
    if (!entries || entries.length === 0) {
      await sendEditProfileHelp(client, message);
      return true;
    }

    try {
      const results = [];
      const errors = [];

      for (const item of entries) {
        const rawKey = String(item.key || '').toLowerCase();
        const mapped = FIELD_MAP[rawKey] || rawKey;

        if (mapped === 'id') {
          errors.push(messages.profile.editprofile.idImmutable);
          continue;
        }

        if (!ALLOWED_FIELDS.has(mapped)) {
          errors.push(messages.profile.editprofile.fieldNotAllowed(mapped));
          continue;
        }

        if (!Object.prototype.hasOwnProperty.call(user, mapped)) {
          errors.push(messages.profile.editprofile.fieldNotFound(mapped));
          continue;
        }

        const validation = validateFieldValue(mapped, item.value);
        if (!validation.valid) {
          errors.push(validation.error);
          continue;
        }

        try {
          await updateProfileField(jid, mapped, validation.value);
          results.push({ field: mapped, value: validation.value });
        } catch (uErr) {
          errors.push(`${mapped}: ${uErr.message}`);
        }
      }

      let responseText = '';
      if (results.length > 0 && errors.length === 0) {
        responseText = messages.profile.editprofile.successBox(results);
      } else if (results.length > 0 && errors.length > 0) {
        responseText = messages.profile.editprofile.partialBox(results, errors);
      } else {
        responseText = messages.profile.editprofile.errorBox(errors);
      }

      await replyText(client, message, responseText);
      return true;
    } catch (error) {
      console.error('[EDITPROFILE] Error:', error);
      await sendEditProfileHelp(client, message);
      return false;
    }
  },
});
