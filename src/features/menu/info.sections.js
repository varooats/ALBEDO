const INFO_MENU_SECTIONS = {
  owner: {
    title: 'OWNER MENU',
    rows: [
      { id: 'owner:ownerinfo', title: '.ownerinfo', description: 'profil pemilik bot' },
      { id: 'owner:setlimit', title: '.setlimit', description: 'atur limit pengguna' },
      { id: 'owner:addlimit', title: '.addlimit', description: 'tambah kuota limit' },
      { id: 'owner:listowner', title: '.listowner', description: 'daftar owner bot' },
      { id: 'owner:addowner', title: '.addowner', description: 'tambah nomor owner' },
      { id: 'owner:delowner', title: '.delowner', description: 'hapus nomor owner' },
      { id: 'owner:backup', title: '.backup', description: 'backup konfigurasi bot' },
      { id: 'owner:restart', title: '.restart', description: 'restart proses bot' },
      { id: 'owner:status', title: '.status', description: 'status server dan bot' },
      { id: 'owner:runtime', title: '.runtime', description: 'lama bot aktif' },
      { id: 'owner:donate', title: '.donate', description: 'dukungan operasional' },
      { id: 'owner:rules', title: '.rules', description: 'aturan penggunaan bot' },
    ],
  },
  group: {
    title: 'GROUP MENU',
    rows: [
      { id: 'group:antilink', title: '.antilink', description: 'proteksi tautan grup' },
      { id: 'group:antitoxic', title: '.antitoxic', description: 'filter kata terlarang' },
      { id: 'group:hidetag', title: '.hidetag', description: 'tag seluruh anggota grup' },
      { id: 'group:grouplink', title: '.grouplink', description: 'ambil tautan grup' },
      { id: 'group:kick', title: '.kick', description: 'keluarkan anggota' },
      { id: 'group:promote', title: '.promote', description: 'jadikan admin grup' },
      { id: 'group:demote', title: '.demote', description: 'turunkan admin grup' },
      { id: 'group:opengroup', title: '.opengroup', description: 'buka izin pesan grup' },
      { id: 'group:closegroup', title: '.closegroup', description: 'tutup izin pesan grup' },
      { id: 'group:groupinfo', title: '.groupinfo', description: 'detail informasi grup' },
      { id: 'group:membercount', title: '.membercount', description: 'jumlah total anggota' },
      { id: 'group:messagecount', title: '.messagecount', description: 'statistik total pesan' },
      { id: 'group:pinchat', title: '.pinchat', description: 'sematkan chat grup' },
      { id: 'group:unpinchat', title: '.unpinchat', description: 'lepas sematan chat' },
    ],
  },
  settings: {
    title: 'SETTINGS MENU',
    rows: [
      { id: 'settings:settings', title: '.settings', description: 'daftar konfigurasi aktif' },
      { id: 'settings:enable', title: '.enable', description: 'aktifkan fitur grup/bot' },
      { id: 'settings:disable', title: '.disable', description: 'matikan fitur grup/bot' },
    ],
  },
  support: {
    title: 'SUPPORT MENU',
    rows: [
      { id: 'support:help', title: '.help', description: 'bantuan penggunaan fitur' },
      { id: 'support:faq', title: '.faq', description: 'pertanyaan umum seputar bot' },
      { id: 'support:report', title: '.report', description: 'laporkan kendala bot' },
      { id: 'support:bug', title: '.bug', description: 'laporkan bug ke admin' },
      { id: 'support:request', title: '.request', description: 'request fitur baru' },
      { id: 'support:feedback', title: '.feedback', description: 'kritik dan saran' },
    ],
  },
  dev: {
    title: 'CONTACT DEV MENU',
    rows: [
      { id: 'dev:dev', title: '.dev', description: 'info profil developer' },
      { id: 'dev:github', title: '.github', description: 'tautan profil GitHub' },
      { id: 'dev:portfolio', title: '.portfolio', description: 'tautan portfolio developer' },
    ],
  },
};

function getMenuSection(key = '') {
  const normalizedKey = String(key || '').toLowerCase();
  return INFO_MENU_SECTIONS[normalizedKey] || null;
}

function buildInfoSection(sectionKey = '') {
  const section = getMenuSection(sectionKey);

  if (!section) {
    return null;
  }

  return {
    title: section.title,
    rows: section.rows.map((row) => ({
      title: row.title,
      id: row.id,
      description: row.description || '',
    })),
  };
}

module.exports = {
  INFO_MENU_SECTIONS,
  getMenuSection,
  buildInfoSection,
};
