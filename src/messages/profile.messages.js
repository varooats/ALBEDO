const profileMessages = {
  notFound: [
    'Profil belum terdaftar.',
    '',
    '╭─『 PERINTAH 』',
    '│ ⟢ ```.register [nama]```',
    '╰──────────────────',
  ].join('\n'),

  loadError: 'Gagal memuat profil. Coba lagi nanti.',

  cardCaption: (user = {}) => [
    '╭─『 IDENTITY CARD 』',
    `│ ⟢ Name  : *${user.name || 'User'}*`,
    `│ ⟢ ID    : \`\`\`${user.id || 'ALB-000001'}\`\`\``,
    `│ ⟢ User  : @${user.username || 'anon'}`,
    `│ ⟢ Level : *${user.level || 1}*`,
    `│ ⟢ EXP   : \`\`\`${user.exp || 0}\`\`\``,
    `│ ⟢ Limit : \`\`\`${user.limit ?? 20}\`\`\``,
    `│ ⟢ House : *${user.house || user.role || 'House of Albedo'}*`,
    `│ ⟢ Birth : \`\`\`${user.birthDate || user.dateOfBirth || user.dob || '—'}\`\`\``,
    '╰──────────────────',
    '',
    '> Ketik ```.editprofile``` untuk mengubah data.',
  ].join('\n'),

  editprofile: {
    help: [
      'Ubah data profilmu dengan format:',
      '```.editprofile field: nilai```',
      '```.editprofile field: nilai|field2: nilai2```',
      '',
      '╭─『 FIELD 』',
      '│ ⟢ ```name```',
      '│ ⟢ ```username```',
      '│ ⟢ ```gender```',
      '│ ⟢ ```age```',
      '│ ⟢ ```bio```',
      '│ ⟢ ```social```',
      '╰──────────────────',
      '',
      '╭─『 CONTOH 』',
      '│ ⟢ ```.editprofile name: Albedo```',
      '│ ⟢ ```.editprofile age: 18|bio: Orang Asing|social: Instagram|username: @albedo```',
      '╰──────────────────',
      '',
      '> ```id``` bersifat permanen.',
    ].join('\n'),

    successBox: (results = []) => {
      const lines = [
        'Profil diperbarui!',
        '',
        '╭─『 PERUBAHAN 』',
      ];
      for (const r of results) {
        lines.push(`│ ⟢ *${r.field}* : \`\`\`${r.value}\`\`\``);
      }
      lines.push('╰──────────────────');
      lines.push('');
      lines.push('> Ketik ```.profile``` untuk lihat hasilnya.');
      return lines.join('\n');
    },

    partialBox: (results = [], errors = []) => {
      const lines = [];
      if (results.length > 0) {
        lines.push('╭─『 BERHASIL 』');
        for (const r of results) {
          lines.push(`│ ⟢ *${r.field}* : \`\`\`${r.value}\`\`\``);
        }
        lines.push('╰──────────────────');
        lines.push('');
      }
      lines.push('⚠️ *Gagal:*');
      for (const e of errors) {
        lines.push(`• ${e}`);
      }
      lines.push('');
      lines.push('> Ketik ```.editprofile``` untuk panduan.');
      return lines.join('\n');
    },

    errorBox: (errors = []) => {
      const lines = ['⚠️ *Gagal mengubah profil:*'];
      for (const e of errors) {
        lines.push(`• ${e}`);
      }
      lines.push('');
      lines.push('╭─『 CONTOH 』');
      lines.push('│ ⟢ ```.editprofile name: Albedo```');
      lines.push('╰──────────────────');
      lines.push('');
      lines.push('> Ketik ```.editprofile``` untuk panduan.');
      return lines.join('\n');
    },

    idImmutable: '```id``` tidak dapat diubah.',
    fieldNotAllowed: (f) => `\`\`\`${f}\`\`\` bukan field valid.`,
    fieldNotFound: (f) => `\`\`\`${f}\`\`\` tidak ada di profil.`,
  },

  register: {
    success: [
      'Registrasi berhasil!',
      '',
      '╭─『 AKUN 』',
      '│ ⟢ Name : *{{name}}*',
      '│ ⟢ ID   : ```{{id}}```',
      '│ ⟢ JID  : ```{{jid}}```',
      '╰──────────────────',
      '',
      '> Ketik ```.profile``` untuk lihat kartu ID.',
    ].join('\n'),
    required: [
      'Kamu belum terdaftar.',
      '',
      '╭─『 PERINTAH 』',
      '│ ⟢ ```.register [nama]```',
      '╰──────────────────',
      '',
      '> Contoh: ```.register Varo```',
    ].join('\n'),
    alreadyRegistered: [
      'Akun sudah terdaftar.',
      '',
      '╭─『 PERINTAH 』',
      '│ ⟢ ```.profile```',
      '│ ⟢ ```.editprofile```',
      '╰──────────────────',
    ].join('\n'),
    error: 'Gagal mendaftar. Coba lagi nanti.',
  },
};

module.exports = { profileMessages };
