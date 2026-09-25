const INFO_MENU_SECTIONS = {
  owner: {
    title: 'OWNER MENU',
    rows: [
      { id: 'owner:owner', title: '.owner', description: 'kontak owner' },
      { id: 'owner:ownerinfo', title: '.ownerinfo', description: 'profil owner' },
      { id: 'owner:rules', title: '.rules', description: 'aturan penggunaan' },
      { id: 'owner:runtime', title: '.runtime', description: 'lama bot online' },
      { id: 'owner:status', title: '.status', description: 'status bot/server' },
      { id: 'owner:donate', title: '.donate', description: 'dukungan operasional' },
    ],
  },
  support: {
    title: 'SUPPORT MENU',
    rows: [
      { id: 'support:help', title: '.help', description: 'bantuan penggunaan fitur' },
      { id: 'support:faq', title: '.faq', description: 'pertanyaan yang sering ditanyakan' },
      { id: 'support:report', title: '.report', description: 'laporkan masalah' },
      { id: 'support:bug', title: '.bug', description: 'laporkan bug' },
      { id: 'support:request', title: '.request', description: 'request fitur' },
      { id: 'support:feedback', title: '.feedback', description: 'kritik dan saran' },
    ],
  },
  dev: {
    title: 'CONTACT DEV MENU',
    rows: [
      { id: 'dev:dev', title: '.dev', description: 'info developer' },
      { id: 'dev:github', title: '.github', description: 'profil GitHub' },
      { id: 'dev:portfolio', title: '.portfolio', description: 'website portfolio' },
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
