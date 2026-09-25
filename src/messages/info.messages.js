const { buildInfoSection } = require('../features/menu/info.sections');

const infoContents = {
  help: {
    commandBoxes: [
      {
        title: 'SUPREME',
        commands: ['.owner', '.ownerinfo', '.rules', '.runtime', '.status', '.donate'],
      },
      {
        title: 'SUPPORT',
        commands: ['.help', '.faq', '.report', '.bug', '.request', '.feedback'],
      },
      {
        title: 'DEVELOPER',
        commands: ['.dev', '.github', '.portfolio'],
      },
    ],
    sectionKey: 'support',
  },

  support: {
    header: 'Pusat bantuan bot:',
    sectionKey: 'support',
  },

  faq: {
    header: [
      '*FAQ*',
      '• Pakai bot: ketik ```.menu```',
      '• Bot lambat: tunggu antrean',
      '• Ada bug: ketik ```.bug```',
      '• Request: ketik ```.request```',
    ].join('\n'),
    sectionKey: 'support',
  },

  report: {
    header: [
      '*Lapor Kendala*',
      'Kirim detail:',
      '• Command yang dipakai',
      '• Tangkapan layar / error',
      '• Waktu kejadian',
    ].join('\n'),
    sectionKey: 'support',
  },

  bug: {
    header: [
      '*Lapor Bug*',
      'Kirim detail:',
      '• Command error',
      '• Pesan error',
      '• Screenshot jika ada',
    ].join('\n'),
    sectionKey: 'support',
  },

  request: {
    header: [
      '*Request Fitur*',
      'Kirim detail:',
      '• Ide / konsep fitur',
      '• Contoh pemakaian',
    ].join('\n'),
    sectionKey: 'support',
  },

  feedback: {
    header: [
      '*Kritik & Saran*',
      'Kirimkan masukanmu untuk bot.',
    ].join('\n'),
    sectionKey: 'support',
  },

  owner: {
    dataTitle: 'OWNER',
    getData: (config = {}) => [
      ['Nama', `*${config.ownerName || 'Owner'}*`],
      ['Kontak', `\`\`\`${config.ownerContact || config.owner || '6280000000000'}\`\`\``],
    ],
    sectionKey: 'owner',
  },

  ownerinfo: {
    dataTitle: 'OWNER INFO',
    getData: (config = {}) => [
      ['Nama', `*${config.ownerName || 'Owner'}*`],
      ['Role', `*${config.ownerRole || 'Pemilik Bot'}*`],
      ['Kontak', `\`\`\`${config.ownerContact || config.owner || '6280000000000'}\`\`\``],
    ],
    sectionKey: 'owner',
  },

  rules: {
    header: [
      '*ATURAN BOT*',
      '1. Jangan spam command',
      '2. Dilarang konten ilegal',
      '3. Jaga etika & privasi',
      '4. Bug lapor ke ```.bug```',
    ].join('\n'),
    sectionKey: 'owner',
  },

  runtime: {
    dataTitle: 'RUNTIME',
    getData: ({ uptime = '0s' } = {}) => [
      ['Uptime', `*${uptime}*`],
      ['Status', '*Active*'],
    ],
    sectionKey: 'owner',
  },

  status: {
    dataTitle: 'STATUS',
    getData: ({ config = {}, uptime = '', memory = '', nodeVersion = process.version, platform = process.platform } = {}) => [
      ['Bot', `*${config.name || 'ALBEDO-BOT'}*`],
      ['Prefix', `[ \`\`\`${config.prefix || '.'}\`\`\` ]`],
      ['Uptime', `*${uptime}*`],
      ['Node', `\`\`\`${nodeVersion}\`\`\``],
      ['OS', `\`\`\`${platform}\`\`\``],
      ['RAM', `\`\`\`${memory}\`\`\``],
    ],
    sectionKey: 'owner',
  },

  donate: {
    header: (config = {}) => config.donateInfo || 'Hubungi owner via ```.owner```.',
    sectionKey: 'owner',
  },

  dev: {
    dataTitle: 'DEVELOPER',
    getData: (config = {}) => [
      ['Dev', `*${config.developerName || 'Varo'}*`],
      ['Role', `*${config.developerRole || 'Lead'}*`],
      ['GitHub', `\`\`\`${config.developerGithub || 'github.com/varo'}\`\`\``],
      ['Web', `\`\`\`${config.developerWebsite || 'varo.dev'}\`\`\``],
    ],
    sectionKey: 'dev',
  },

  github: {
    header: (config = {}) => `GitHub:\n\`\`\`${config.developerGithub || 'https://github.com/varo'}\`\`\``,
    sectionKey: 'dev',
  },

  portfolio: {
    header: (config = {}) => `Portfolio:\n\`\`\`${config.developerWebsite || 'https://varo.dev'}\`\`\``,
    sectionKey: 'dev',
  },
};

function buildBorder(title = 'INFO') {
  return `╭─『 ${String(title).toUpperCase()} 』`;
}

function buildCommandBox(title, commands = []) {
  if (!Array.isArray(commands) || commands.length === 0) return null;
  return [
    buildBorder(title),
    ...commands.map((cmd) => `│ ⟢ \`\`\`${cmd}\`\`\``),
    '╰──────────────────',
  ].join('\n');
}

function buildDataBox(title, entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return [
    buildBorder(title),
    ...entries.map(([k, v]) => `│ ⟢ ${k} : ${v}`),
    '╰──────────────────',
  ].join('\n');
}

function buildMenuBox(sectionKey) {
  const section = buildInfoSection(sectionKey);
  if (!section || !Array.isArray(section.rows) || section.rows.length === 0) {
    return null;
  }
  return [
    buildBorder(section.title || 'MENU'),
    ...section.rows.map((row) => `│ ⟢ \`\`\`${row.title}\`\`\``),
    '╰──────────────────',
  ].join('\n');
}

function buildInfoMessage({
  header = '',
  dataBox = null,
  commandBoxes = [],
  sectionKey = null,
  footer = '',
  quote = '「すべては、我が主様のために。」',
  title = null,
  details = null,
} = {}) {
  const parts = [];

  if (header) {
    parts.push(header.trim());
  }

  if (dataBox) {
    parts.push(dataBox);
  }

  if (Array.isArray(commandBoxes) && commandBoxes.length > 0) {
    for (const box of commandBoxes) {
      const boxText = buildCommandBox(box.title, box.commands);
      if (boxText) parts.push(boxText);
    }
  }

  if (sectionKey && (!commandBoxes || commandBoxes.length === 0)) {
    const menuBoxText = buildMenuBox(sectionKey);
    if (menuBoxText) parts.push(menuBoxText);
  }

  if (details && !dataBox && (!commandBoxes || commandBoxes.length === 0)) {
    const lines = Array.isArray(details) ? details : [String(details)];
    const commandLines = lines
      .map((l) => String(l || '').trim())
      .filter((l) => l.startsWith('.') || l.startsWith('• ```.'));

    if (commandLines.length > 0) {
      parts.push([
        buildBorder(title || 'MENU'),
        ...commandLines.map((c) => `│ ⟢ \`\`\`${c.replace(/^[•\-\s`]+/, '').replace(/[`\s]+$/, '')}\`\`\``),
        '╰──────────────────',
      ].join('\n'));
    }
  }

  if (footer) {
    parts.push(footer.trim());
  }

  if (quote) {
    parts.push(`> ${quote}`);
  }

  return parts.join('\n\n');
}

function buildInfoInteractivePayload({
  header = '',
  dataBox = null,
  commandBoxes = [],
  sectionKey = null,
  footer = '',
  title = 'INFO',
  details = null,
} = {}) {
  const section = buildInfoSection(sectionKey);

  return {
    title: String(title).toUpperCase(),
    body: buildInfoMessage({ header, dataBox, commandBoxes, sectionKey, footer, title, details }),
    sections: section ? [section] : [],
  };
}

function getInfoPayload(key, context = {}) {
  const template = infoContents[key];
  if (!template) {
    return buildInfoInteractivePayload({ title: key, header: '' });
  }

  const header = typeof template.header === 'function' ? template.header(context) : (template.header || '');
  const footer = typeof template.footer === 'function' ? template.footer(context) : (template.footer || '');

  let dataBox = null;
  if (template.dataTitle && typeof template.getData === 'function') {
    const entries = template.getData(context);
    dataBox = buildDataBox(template.dataTitle, entries);
  }

  return buildInfoInteractivePayload({
    title: template.title || template.dataTitle || key,
    header,
    dataBox,
    commandBoxes: template.commandBoxes || [],
    sectionKey: template.sectionKey || null,
    footer,
  });
}

module.exports = {
  infoContents,
  getInfoPayload,
  buildInfoMessage,
  buildInfoInteractivePayload,
  buildBorder,
  buildCommandBox,
  buildDataBox,
  buildMenuBox,
};
